import fs from "fs";
import path from "path";

import YAML from "yaml";
import { z } from "zod";

import pathConfig from "@/config/paths";

export const schema = z.object({
  Deployments: z.array(
    z.object({
      commit: z.string(),
      build_id: z.string(),
      paths: z.object({
        root: z.string(),
        logs: z.string(),
        pm2_config: z.string().optional(),
      }),
      status: z.object({ success: z.boolean(), active: z.boolean() }),
    })
  ),
});

export type Deployment = z.infer<typeof schema>["Deployments"][number];

export default async function getAllDeployments() {
 
  if (!fs.existsSync(pathConfig.deployments)) {
    throw new Error(
      `Deployments path does not exist: ${pathConfig.deployments}`
    );
  }

  const subdirectoriesInDeployments = fs
    .readdirSync(pathConfig.deployments, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  const allDeployments: Record<string, Deployment[]> = {};

  for (const subdirectory of subdirectoriesInDeployments) {
    const deploymentHistoryPath = path.join(
      pathConfig.deployments,
      subdirectory,
      "history.yaml"
    );
    if (!fs.existsSync(deploymentHistoryPath)) {
      continue;
    }

    const fileContent = fs.readFileSync(deploymentHistoryPath, "utf8");

    let data;
    try {
      data = YAML.parse(fileContent);
    } catch (error) {
      throw new Error(`Error parsing config file: ${error}`);
    }

    const schemaParseResult = schema.safeParse(data);
    if (!schemaParseResult.success) {
      throw new Error(
        `Deployment file schema validation failed: ${JSON.stringify(schemaParseResult.error.issues)}`
      );
    }

    allDeployments[subdirectory] = schemaParseResult.data.Deployments;
  }

  return allDeployments;
}
