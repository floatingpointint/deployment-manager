import fs from "fs";
import vm from "vm";

import { z } from "zod";

export const schema = z.object({
  apps: z.array(
    z.object({
      name: z.string(),
    })
  ),
});

export default async function getPm2Names(filename: string) {
  if (!fs.existsSync(filename)) {
    throw new Error(`PM2 Config file not found: ${filename}`);
  }

  const fileContent = fs.readFileSync(filename, "utf8");

  const config = vm.runInNewContext(fileContent, {
    module: { exports: {} },
  });

  const schemaParseResult = schema.safeParse(config);

  if (!schemaParseResult.success) {
    throw new Error(`Invalid PM2 Config file: ${filename}`);
  }

  return schemaParseResult.data.apps.map((app) => app.name);
}
