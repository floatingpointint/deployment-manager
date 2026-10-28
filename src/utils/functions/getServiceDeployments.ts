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

export default async function getServiceDeployments(service: string) {
  const serviceDeploymentHistoryPath = path.join(
    pathConfig.deployments,
    service,
    "history.yaml"
  );

  if (!fs.existsSync(serviceDeploymentHistoryPath)) {
    return [[] as Deployment[], serviceDeploymentHistoryPath] as const;
  }

  const fileContent = fs.readFileSync(serviceDeploymentHistoryPath, "utf8");

  let data;
  try {
    data = YAML.parse(fileContent);
  } catch (error) {
    throw new Error(`Error parsing config file: ${error}`);
  }

  const schemaParseResult = schema.safeParse(data);
  if (!schemaParseResult.success) {
    throw new Error(
      `Config file schema validation failed: ${JSON.stringify(schemaParseResult.error.issues)}`
    );
  }

  return [
    schemaParseResult.data.Deployments,
    serviceDeploymentHistoryPath,
  ] as const;
}
