import type { Root } from "./types";
import type { NextRequest } from "next/server";

import child_process from "child_process";
import crypto from "crypto";
import fs, { appendFile } from "fs";
import { appendFile as appendFileAsync } from "fs/promises";
import path from "path";

import { Mutex } from "async-mutex";
import dotenv from "dotenv";
import { NextResponse } from "next/server";
import { simpleGit } from "simple-git";
import YAML from "yaml";

import ENV from "@utils/environment/variables";
import type { Deployment } from "@utils/functions/getAllDeployments";
import getAllServiceConfigs, {
  type Service,
} from "@utils/functions/getAllServiceConfigs";
import getPm2Names from "@utils/functions/getPm2Names";
import getServiceDeployments from "@utils/functions/getServiceDeployments";

import pathConfig from "@/config/paths";
import { serviceBuildStates } from "@/config/states";

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

  const services = await getAllServiceConfigs();

  for (const service of services) {
    if (service.disabled) continue;

    if (
      service.remote.name === payload.repository.full_name &&
      service.remote.branch === payload.ref.replace("refs/heads/", "")
    ) {
      updateService(service, payload);
    }
  }

  return new NextResponse(null, { status: 200 });
}

type CommitLike = {
  after: string;
  repository: {
    full_name: string;
    ssh_url: string;
  };
};

export async function updateService(service: Service, payload: CommitLike) {
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

  DeletedOldBuildFiles = "deleted_old_build_files",
  InstallingBuildDependencies = "installing_build_dependencies",
  CloningBuildFiles = "cloning_build_files",
  CopyingSourceFiles = "copying_source_files",
  RunningBuildCommand = "running_build_command",

  StartingPm2Process = "starting_pm2_process",

  Failed = "failed",
}

async function updateServiceWithMutex(service: Service, payload: CommitLike) {
  const servicePath = path.join(pathConfig.services, service.paths.root);
  if (!fs.existsSync(servicePath)) {
    throw new Error(`Service path does not exist: ${servicePath}.`);
  }

  const git = simpleGit(path.join(pathConfig.services, service.paths.root));

  serviceBuildStates.set(service.process_id, BuildStates.FetchingCommitHash);

  const pullResult = await git
    .fetch()
    .then(() => git.checkout(payload.after))
    .then(() => [true, null] as const)
    .catch((error) => [false, error] as const);
  if (pullResult[0] === false) {
    // eslint-disable-next-line no-console
    console.error("failed to checkout to branch: ", pullResult[1]);
    return serviceBuildStates.delete(service.process_id);
  }

  serviceBuildStates.set(
    service.process_id,
    BuildStates.ReinstallingServiceDependencies
  );

  const installResult = await promisify_spawn(
    service.build.install_command,
    path.join(pathConfig.services, service.paths.root)
  );
  if (installResult === false) {
    // eslint-disable-next-line no-console
    console.error("failed to install dependencies in services");
    return serviceBuildStates.delete(service.process_id);
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

  // the deploymentLogsPath will include deploymentHistory in a parent
  // directory so it does not need to be rechecked and created
  if (!fs.existsSync(path.dirname(deploymentLogsPath))) {
    fs.mkdirSync(path.dirname(deploymentLogsPath), { recursive: true });
  }

  await appendFileAsync(
    deploymentLogsPath,
    "= STARTING DEPLOYMENT SERVICE =\n",
    "utf8"
  );
  await appendFileAsync(
    deploymentLogsPath,
    `REPOSITORY: ${payload.repository.full_name}:${service.remote.branch}\n`,
    "utf8"
  );
  await appendFileAsync(
    deploymentLogsPath,
    `COMMIT HASH: ${payload.after}\n`,
    "utf8"
  );
  await appendFileAsync(deploymentLogsPath, `BUILD ID: ${buildId}\n`, "utf8");
  await appendFileAsync(
    deploymentLogsPath,
    `BUILD PATH: ${buildFilesDirectoryPath}\n`,
    "utf8"
  );

  serviceBuildStates.set(service.process_id, BuildStates.DeletedOldBuildFiles);

  await appendFileAsync(
    deploymentLogsPath,
    "\n== DELETING OLD BUILD FILES ==\n",
    "utf8"
  );

  const deploymentHistory = await getServiceDeployments(service.process_id);

  const deploymentsList = deploymentHistory[0];

  const indexOfLastSuccessfulDeployment = deploymentsList.findLastIndex(
    (deployment) => deployment.status.success
  );

  let deleteCount = 0;
  for (
    let i = 0;
    i < deploymentsList.length - service.build.builds_to_retain;
    i++
  ) {
    if (i === indexOfLastSuccessfulDeployment) continue;

    const deploymentToDelete = deploymentsList[i - deleteCount];
    if (!deploymentToDelete) throw new Error("deploymentToDelete undefined");

    await appendFileAsync(
      deploymentLogsPath,
      ["$$", "rm", "-rf", deploymentToDelete.paths.root].join(" ") + "\n",
      "utf8"
    );

    fs.rmSync(deploymentToDelete.paths.root, { recursive: true, force: true });

    await appendFileAsync(
      deploymentLogsPath,
      ["$$", "rm", "-rf", deploymentToDelete.paths.logs].join(" ") + "\n",
      "utf8"
    );

    fs.rmSync(deploymentToDelete.paths.logs, { recursive: true, force: true });

    deploymentsList.splice(i - deleteCount++, 1);
  }

  deploymentsList.push(newDeployment);

  fs.writeFileSync(
    deploymentHistory[1],
    YAML.stringify({ Deployments: deploymentsList }),
    "utf8"
  );

  serviceBuildStates.set(service.process_id, BuildStates.CloningBuildFiles);

  await appendFileAsync(
    deploymentLogsPath,
    "\n== CLONING BUILD FILES ==\n",
    "utf8"
  );
  await appendFileAsync(
    deploymentLogsPath,
    [
      "$$",
      "git clone",
      payload.repository.ssh_url,
      buildFilesDirectoryPath,
      "--origin",
      payload.repository.full_name,
      "--no-checkout",
    ].join(" ") + "\n",
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
    await appendFileAsync(deploymentLogsPath, cloneResult[1] + "", "utf8");

    return serviceBuildStates.delete(service.process_id);
  }

  await appendFileAsync(
    deploymentLogsPath,
    "\n== CHECKING OUT TARGET COMMIT ==\n",
    "utf8"
  );
  await appendFileAsync(
    deploymentLogsPath,
    ["$$", "git checkout", payload.after].join(" ") + "\n",
    "utf8"
  );

  const newTargetGit = simpleGit(buildFilesDirectoryPath);

  const checkoutTargetResult = await newTargetGit
    .checkout(payload.after)
    .then(() => [true, null] as const)
    .catch((error) => [false, error] as const);
  if (checkoutTargetResult[0] === false) {
    await appendFileAsync(
      deploymentLogsPath,
      checkoutTargetResult[1] + "",
      "utf8"
    );

    return serviceBuildStates.delete(service.process_id);
  }

  serviceBuildStates.set(service.process_id, BuildStates.CopyingSourceFiles);

  await appendFileAsync(
    deploymentLogsPath,
    "\n== COPYING SOURCE FILES ==\n",
    "utf8"
  );

  for (const file of service.build.files_to_copy) {
    const serviceFilePath = path.join(
      pathConfig.services,
      service.paths.root,
      file
    );
    const buildFilePath = path.join(buildFilesDirectoryPath, file);

    await appendFileAsync(
      deploymentLogsPath,
      ["$$", "cp", serviceFilePath, buildFilePath, "-rf"].join(" ") + "\n",
      "utf8"
    );

    try {
      fs.cpSync(serviceFilePath, buildFilePath, {
        recursive: true,
        force: true,
      });
    } catch (error) {
      await appendFileAsync(deploymentLogsPath, error + "", "utf8");

      fs.writeFileSync(
        deploymentHistory[1],
        YAML.stringify({ Deployments: deploymentsList }),
        "utf8"
      );

      return serviceBuildStates.delete(service.process_id);
    }
  }

  serviceBuildStates.set(
    service.process_id,
    BuildStates.InstallingBuildDependencies
  );

  await appendFileAsync(
    deploymentLogsPath,
    "\n== INSTALLING BUILD DEPENDENCIES ==\n",
    "utf8"
  );

  const environmentParse = dotenv.config({
    path: path.join(buildFilesDirectoryPath, ".env"),
  });

  const env = {
    ...process.env,
    ...environmentParse.parsed,
    NODE_ENV: "production",
  } satisfies NodeJS.ProcessEnv;

  const installTargetResult = await promisify_spawn(
    service.build.install_command,
    buildFilesDirectoryPath,
    { env, output: deploymentLogsPath }
  );
  if (installTargetResult === false) {
    return serviceBuildStates.delete(service.process_id);
  }

  serviceBuildStates.set(service.process_id, BuildStates.RunningBuildCommand);

  await appendFileAsync(deploymentLogsPath, "\n== RUNNING BUILD COMMAND ==\n");

  const buildCommandResult = await promisify_spawn(
    service.build.build_command,
    buildFilesDirectoryPath,
    { env, output: deploymentLogsPath }
  );
  if (buildCommandResult === false) {
    return serviceBuildStates.delete(service.process_id);
  }

  serviceBuildStates.set(service.process_id, BuildStates.StartingPm2Process);

  await appendFileAsync(
    deploymentLogsPath,
    "\n== STARTING PM2 PROCESS ==\n",
    "utf8"
  );

  const pm2ConfigPath = path.join(
    buildFilesDirectoryPath,
    service.paths.pm2_config
  );

  const pm2ProcessesInBuild = await getPm2Names(pm2ConfigPath);

  // THIS STATEMENT DOES NOT NEED TO BE RETURNED ON ERROR
  // AS IT IS EXPECTED THAT THE PM2 PROCESS MAY NOT EXIST YET
  await promisify_spawn(
    `pm2 delete ${pm2ProcessesInBuild.join(" ")}`,
    buildFilesDirectoryPath,
    { output: deploymentLogsPath }
  );

  await appendFileAsync(deploymentLogsPath, "\n", "utf8");

  const startPm2Processes = await promisify_spawn(
    `pm2 start "${service.paths.pm2_config}"`,
    buildFilesDirectoryPath,
    { env, output: deploymentLogsPath }
  );
  if (startPm2Processes === false) {
    return serviceBuildStates.delete(service.process_id);
  }

  newDeployment.status.success = true;
  newDeployment.status.active = true;
  newDeployment.paths.pm2_config = pm2ConfigPath;

  for (const deployment of deploymentsList.slice(0, -1)) {
    deployment.status.active = false;
  }

  await appendFileAsync(
    deploymentLogsPath,
    "\n== UPDATING DEPLOYMENT HISTORY ==\n",
    "utf8"
  );

  await appendFileAsync(
    deploymentLogsPath,
    ["$$", "nano", deploymentHistory[1]].join(" ") + "\n\n",
    "utf8"
  );

  await appendFileAsync(
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

  await appendFileAsync(
    deploymentLogsPath,
    "=== SUCCESSFULLY DEPLOYED NEW VERSION ===\n",
    "utf8"
  );

  serviceBuildStates.delete(service.process_id);
}

function nullishMapGetter<K, V>(map: Map<K, V>, key: K, defaultValue: V): V {
  const existingRecord = map.get(key);
  if (existingRecord !== undefined) return existingRecord;

  map.set(key, defaultValue);
  return defaultValue;
}

async function promisify_spawn(
  command: string,
  cwd: string,
  {
    env,
    output,
  }: {
    env?: NodeJS.ProcessEnv;
    output?: string;
  } = {}
) {
  return new Promise<boolean>((resolve, reject) => {
    const startTime = Date.now();

    const spawnOptions: child_process.SpawnOptionsWithStdioTuple<
      child_process.StdioNull,
      child_process.StdioPipe,
      child_process.StdioPipe
    > = {
      shell: true,
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
    };

    spawnOptions.env = {
      ...process.env,
      ...(env ?? {}),
      FORCE_COLOR: "0",
      NO_COLOR: "1",
    };

    if (output) {
      appendFile(output, `$$ ${command}\n~ ${cwd}\n\n`, (err) => {
        if (err) reject(err);
      });
    }

    const child = child_process.spawn(command, spawnOptions);

    child.stdout.on("data", (data: Buffer) => {
      if (output) {
        appendFile(output, data.toString(), (err) => {
          if (err) reject(err);
        });
      }
    });

    child.stderr.on("data", (data: Buffer) => {
      if (output) {
        appendFile(output, "\n" + data.toString() + "\n", (err) => {
          if (err) reject(err);
        });
      }
    });

    child.on("close", (code) => {
      if (output) {
        appendFile(
          output,
          `[process ran for ${((Date.now() - startTime) / 1000).toFixed(3)}s]\n`,
          (err) => {
            if (err) reject(err);
          }
        );
      }

      if (code === 0) resolve(true);
      else resolve(false);
    });
  });
}
