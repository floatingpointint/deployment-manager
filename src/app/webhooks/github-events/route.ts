import type { Root } from "./types";
import type { NextRequest } from "next/server";

import child_process from "child_process";
import crypto from "crypto";
import fs from "fs";
import { appendFile } from "fs/promises";
import path from "path";
import { promisify } from "util";

import { Mutex } from "async-mutex";
import dotenv from "dotenv";
import { NextResponse } from "next/server";
import { simpleGit } from "simple-git";
import YAML from "yaml";

import ENV from "@utils/environment/variables";
import getConfigFile, { type Service } from "@utils/functions/getConfigFile";
import getPm2Names from "@utils/functions/getPm2Names";
import getServiceDeployments, {
  type Deployment,
} from "@utils/functions/getServiceDeployments";

import pathConfig from "@/config/paths";
import { serviceBuildStates } from "@/config/states";

const exec = promisify(child_process.exec);

const getMutexMutex = new Mutex();
const serviceMutexes = new Map<string, Mutex>();

export async function POST(request: NextRequest) {
  const signature = request.headers.get("X-Hub-Signature-256");
  if (!signature) return new NextResponse(null, { status: 400 });

  const text = await request.text();

  const hmac = crypto
    .createHmac("sha256", ENV.GITHUB_WEBHOOK_SECRET)
    .update(text)
    .digest("hex");

  const expected = `sha256=${hmac}`;

  const valid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );

  if (!valid) return new NextResponse(null, { status: 401 });

  const event = request.headers.get("X-Github-Event");

  if (event === "ping") return new NextResponse(null, { status: 204 });
  if (event !== "push") return new NextResponse(null, { status: 400 });

  const params = new URLSearchParams(text);
  const payloadText = params.get("payload");
  if (!payloadText) return new NextResponse(null, { status: 400 });
  const payload = JSON.parse(payloadText) as Root;

  const services = await getConfigFile();

  for (const service of services) {
    if (
      service.remote.name === payload.repository.full_name &&
      service.remote.branch === payload.ref.replace("refs/heads/", "")
    ) {
      updateService(service, payload);
    }
  }

  return new NextResponse(null, { status: 200 });
}

async function updateService(service: Service, payload: Root) {
  const serviceMutex = await getMutexMutex.runExclusive(async () => {
    return nullishMapGetter(serviceMutexes, service.name, new Mutex());
  });

  await serviceMutex.runExclusive(async () => {
    await updateServiceWithMutex(service, payload);
  });
}

export enum BuildStates {
  FetchingCommitHash = "fetching_commit_hash",
  ReinstallingServiceDependencies = "reinstalling_service_dependencies",

  CreatingBuildHashes = "creating_build_hashes",
  InstallingBuildDependencies = "installing_build_dependencies",
  CloningBuildFiles = "cloning_build_files",
  CopyingSourceFiles = "copying_source_files",
  RunningBuildCommand = "running_build_command",

  StartingPm2Process = "starting_pm2_process",

  Failed = "failed",
}

async function updateServiceWithMutex(service: Service, payload: Root) {
  const serviceBuilds = nullishMapGetter(
    serviceBuildStates,
    service.process_id,
    new Map<string, string>()
  );

  const git = simpleGit(path.join(pathConfig.services, service.paths.root));

  serviceBuilds.set(payload.after, BuildStates.FetchingCommitHash);

  const pullResult = await git
    .fetch()
    .then(() => git.checkout(payload.after))
    .then(() => [true, null] as const)
    .catch((error) => [false, error] as const);
  if (pullResult[0] === false) {
    // eslint-disable-next-line no-console
    console.error("failed to checkout to branch");
    return serviceBuilds.delete(payload.after);
  }

  serviceBuilds.set(payload.after, BuildStates.ReinstallingServiceDependencies);

  const installResult = await exec(service.build.install_command, {
    cwd: path.join(pathConfig.services, service.paths.root),
  })
    .then(() => [true, null] as const)
    .catch((error) => [false, error] as const);
  if (installResult[0] === false) {
    // eslint-disable-next-line no-console
    console.error("failed to install dependencies in services");
    return serviceBuilds.delete(payload.after);
  }

  const buildId = Date.now().toString(32);

  const buildFilesDirectoryPath = path.join(
    pathConfig.builds,
    service.process_id,
    payload.after,
    buildId
  );

  const deploymentLogsPath = path.join(
    pathConfig.deployments,
    service.process_id,
    "logs",
    buildId + ".log"
  );

  const newDeployment: Deployment = {
    commit: payload.after,
    build_id: buildId,

    paths: {
      root: buildFilesDirectoryPath,
      logs: deploymentLogsPath,
    },

    status: {
      success: false,
      active: false,
    },
  };

  const deploymentHistory = await getServiceDeployments(service.process_id);
  const deploymentsList = deploymentHistory[0].slice(-199);
  deploymentsList.push(newDeployment);

  // the deploymentLogsPath will include deploymentHistory in a parent
  // directory so it does not need to be rechecked and created
  if (!fs.existsSync(path.dirname(deploymentLogsPath))) {
    fs.mkdirSync(path.dirname(deploymentLogsPath), { recursive: true });
  }

  serviceBuilds.set(payload.after, BuildStates.CloningBuildFiles);

  await appendFile(deploymentLogsPath, "== CLONING BUILD FILES ==\n", "utf8");
  await appendFile(
    deploymentLogsPath,
    [
      ">>",
      "git clone",
      payload.repository.ssh_url,
      buildFilesDirectoryPath,
      "--origin",
      payload.repository.full_name,
      "--no-checkout",
    ].join(" ") + "\n\n",
    "utf8"
  );

  const cloneResult = await git
    .clone(payload.repository.ssh_url, buildFilesDirectoryPath, [
      "--origin",
      payload.repository.full_name,
      "--no-checkout",
    ])
    .then(() => [true, null] as const)
    .catch((error) => [false, error] as const);
  if (cloneResult[0] === false) {
    await appendFile(
      deploymentLogsPath,
      `[FAILURE]: Error cloning repository\n\n`,
      "utf8"
    );
    await appendFile(deploymentLogsPath, cloneResult[1] + "", "utf8");

    // eslint-disable-next-line no-console
    console.error("failed to clone repository");
    return serviceBuilds.delete(payload.after);
  }

  await appendFile(
    deploymentLogsPath,
    "== CHECKING OUT TARGET COMMIT ==\n",
    "utf8"
  );
  await appendFile(
    deploymentLogsPath,
    [">>", "git checkout", payload.after].join(" ") + "\n\n",
    "utf8"
  );

  const newTargetGit = simpleGit(buildFilesDirectoryPath);

  const checkoutTargetResult = await newTargetGit
    .checkout(payload.after)
    .then(() => [true, null] as const)
    .catch((error) => [false, error] as const);
  if (checkoutTargetResult[0] === false) {
    await appendFile(
      deploymentLogsPath,
      `[FAILURE]: Error checking out commit ${payload.after}\n\n`,
      "utf8"
    );
    await appendFile(deploymentLogsPath, checkoutTargetResult[1] + "", "utf8");

    // eslint-disable-next-line no-console
    console.error(`failed to checkout commit ${payload.after}`);

    return serviceBuilds.delete(payload.after);
  }

  serviceBuilds.set(payload.after, BuildStates.CopyingSourceFiles);

  await appendFile(deploymentLogsPath, "== COPYING SOURCE FILES ==\n", "utf8");

  for (const file of service.build.files_to_copy) {
    const serviceFilePath = path.join(
      pathConfig.services,
      service.paths.root,
      file
    );
    const buildFilePath = path.join(buildFilesDirectoryPath, file);

    await appendFile(
      deploymentLogsPath,
      [">>", "cp", serviceFilePath, buildFilePath, "-rf"].join(" ") + "\n",
      "utf8"
    );

    fs.cpSync(serviceFilePath, buildFilePath, {
      recursive: true,
      force: true,
    });
  }

  await appendFile(deploymentLogsPath, "\n", "utf8");

  serviceBuilds.set(payload.after, BuildStates.InstallingBuildDependencies);

  await appendFile(
    deploymentLogsPath,
    "== INSTALLING BUILD DEPENDENCIES ==\n",
    "utf8"
  );
  await appendFile(
    deploymentLogsPath,
    [">>", service.build.install_command].join(" ") + "\n\n",
    "utf8"
  );

  const installTargetResult = await exec(service.build.install_command, {
    cwd: buildFilesDirectoryPath,
  })
    .then(() => [true, null] as const)
    .catch((error) => [false, error] as const);
  if (installTargetResult[0] === false) {
    await appendFile(
      deploymentLogsPath,
      `[FAILURE]: Error installing build dependencies\n\n`,
      "utf8"
    );
    await appendFile(deploymentLogsPath, installTargetResult[1] + "", "utf8");

    // eslint-disable-next-line no-console
    console.error("failed to install build dependencies");

    return serviceBuilds.delete(payload.after);
  }

  serviceBuilds.set(payload.after, BuildStates.RunningBuildCommand);

  await appendFile(deploymentLogsPath, "== RUNNING BUILD COMMAND ==\n");
  await appendFile(
    deploymentLogsPath,
    [">>", service.build.build_command].join(" ") + "\n\n",
    "utf8"
  );

  let env;

  const environmentParse = dotenv.config({
    path: path.join(buildFilesDirectoryPath, ".env"),
    processEnv: {},
  });

  if (environmentParse.parsed) {
    env = environmentParse.parsed;
  } else {
    env = {};
  }

  env = {
    NODE_ENV: "production",
    ...env,
  } satisfies NodeJS.ProcessEnv;

  const buildCommandResult = await exec(service.build.build_command, {
    cwd: buildFilesDirectoryPath,
    env,
  })
    .then(() => [true, null] as const)
    .catch((error) => [false, error] as const);
  if (buildCommandResult[0] === false) {
    await appendFile(
      deploymentLogsPath,
      `[FAILURE]: Error running build command\n\n`,
      "utf8"
    );
    await appendFile(deploymentLogsPath, buildCommandResult[1] + "", "utf8");

    // eslint-disable-next-line no-console
    console.error("failed to run build command");

    return serviceBuilds.delete(payload.after);
  }

  serviceBuilds.set(payload.after, BuildStates.StartingPm2Process);

  await appendFile(deploymentLogsPath, "== STARTING PM2 PROCESS ==\n", "utf8");

  const pm2ConfigPath = path.join(
    buildFilesDirectoryPath,
    service.paths.pm2_config
  );

  const pm2ProcessesInBuild = await getPm2Names(pm2ConfigPath);

  await appendFile(
    deploymentLogsPath,
    [">>", "pm2 delete", pm2ProcessesInBuild.join(" ")].join(" ") + "\n",
    "utf8"
  );

  const deletePm2Processes = await exec(
    `pm2 delete ${pm2ProcessesInBuild.join(" ")}`,
    {
      cwd: buildFilesDirectoryPath,
    }
  )
    .then(() => [true, null] as const)
    .catch((error) => [false, error] as const);
  if (deletePm2Processes[0] === false) {
    await appendFile(
      deploymentLogsPath,
      `[FAILURE]: Error deleting PM2 processes\n\n`,
      "utf8"
    );
    await appendFile(deploymentLogsPath, deletePm2Processes[1] + "", "utf8");

    // THIS STATEMENT DOES NOT NEED TO BE RETURNED ON ERROR
    // AS IT IS EXPECTED THAT THE PM2 PROCESS MAY NOT EXIST YET
  }

  await appendFile(
    deploymentLogsPath,
    [">>", "pm2 start", pm2ConfigPath].join(" ") + "\n\n",
    "utf8"
  );

  const startPm2Processes = await exec(
    `pm2 start "${service.paths.pm2_config}"`,
    { cwd: buildFilesDirectoryPath, env }
  )
    .then(() => [true, null] as const)
    .catch((error) => [false, error] as const);
  if (startPm2Processes[0] === false) {
    await appendFile(
      deploymentLogsPath,
      `[FAILURE]: Error starting PM2 processes\n\n`,
      "utf8"
    );
    await appendFile(deploymentLogsPath, startPm2Processes[1] + "", "utf8");

    return serviceBuilds.delete(payload.after);
  }

  newDeployment.status.success = true;
  newDeployment.status.active = true;
  newDeployment.paths.pm2_config = pm2ConfigPath;

  const lastDeployment = deploymentsList[deploymentsList.length - 2];
  if (lastDeployment) lastDeployment.status.active = false;

  await appendFile(
    deploymentLogsPath,
    "== UPDATING DEPLOYMENT HISTORY ==\n",
    "utf8"
  );

  await appendFile(
    deploymentLogsPath,
    [">>", "nano", deploymentHistory[1]].join(" ") + "\n",
    "utf8"
  );

  await appendFile(
    deploymentLogsPath,
    JSON.stringify(deploymentsList[deploymentsList.length - 1], null, 2) +
      "\n\n",
    "utf8"
  );

  fs.writeFileSync(
    deploymentHistory[1],
    YAML.stringify({ Deployments: deploymentsList }),
    "utf8"
  );

  await appendFile(
    deploymentLogsPath,
    "=== SUCCESSFULLY DEPLOYED NEW VERSION ===\n",
    "utf8"
  );

  serviceBuilds.delete(payload.after);
}

function nullishMapGetter<K, V>(map: Map<K, V>, key: K, defaultValue: V): V {
  const existingRecord = map.get(key);
  if (existingRecord !== undefined) return existingRecord;

  map.set(key, defaultValue);
  return defaultValue;
}
