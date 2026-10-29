import path from "path";

import pathConfig from "@/config/paths";

import getAllDeployments from "./getAllDeployments";

export default async function getServiceDeployments(service: string) {
  const deploymentHistoryPath = path.join(
    pathConfig.deployments,
    service,
    "history.yaml"
  );

  const allDeployments = await getAllDeployments();
  return [allDeployments[service] ?? [], deploymentHistoryPath] as const;
}
