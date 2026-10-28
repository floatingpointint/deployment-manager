import path from "path";
import url from "url";

const __filename = url.fileURLToPath(import.meta.url);

const rootDirectory = path.join(
  __filename, // ./deployment-manager/src/config/...
  "..", // ./deployment-manager/src
  "..", // ./deployment-manager
  "..", // ./
  ".." // .
);

export type Paths = typeof pathConfig;

const pathConfig = {
  root: rootDirectory,

  manager: path.join(rootDirectory, "deployment-manager"),
  services: path.join(rootDirectory, "services"),
  builds: path.join(rootDirectory, "builds"),
  deployments: path.join(rootDirectory, "deployments"),
};

export default pathConfig;
