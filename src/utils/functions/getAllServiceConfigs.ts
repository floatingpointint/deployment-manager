import fs from "fs";
import path from "path";

import YAML from "yaml";
import { z } from "zod";

import pathConfig from "@/config/paths";

const configFilename = path.join(pathConfig.manager, "config.yaml");

export const schema = z.object({
  Services: z
    .array(
      z.object({
        name: z.string(),
        process_id: z.string(),
        remote: z.object({
          name: z.string(),
          branch: z.string(),
        }),
        paths: z.object({
          root: z.string(),
          pm2_config: z.string(),
        }),
        build: z.object({
          install_command: z.string(),
          build_command: z.string(),
          start_command: z.string(),
          files_to_copy: z.array(z.string()),
        }),
        disabled: z.boolean().optional(),
      })
    )
    .superRefine((services, ctx) => {
      const seen = new Set<string>();

      services.forEach((service, index) => {
        if (seen.has(service.process_id)) {
          ctx.addIssue({
            code: "custom",
            message: `Duplicate process_id: ${service.process_id}`,
            path: [index, "process_id"],
          });
        }

        seen.add(service.process_id);
      });
    }),
});

export type Service = z.infer<typeof schema>["Services"][number];

export default async function getAllServiceConfigs() {
  if (!fs.existsSync(configFilename)) {
    throw new Error(`Config file not found: ${configFilename}`);
  }

  const fileContent = fs.readFileSync(configFilename, "utf8");

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

  return schemaParseResult.data.Services;
}
