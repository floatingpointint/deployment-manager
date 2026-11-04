import fs from "fs";

import { cn, Surface } from "@heroui/react";

import getServiceDeployments from "@utils/functions/getServiceDeployments";

export const instant = false;

export default async function Home(
  props: PageProps<"/admin/services/[serviceId]">
) {
  const { serviceId } = await props.params;

  const deployments = await getServiceDeployments(serviceId);

  if (deployments[0].length === 0) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 py-2">
        <h1 className="text-4xl font-bold">No Deployments Found</h1>
        <p className="text-muted max-w-md text-center text-lg">
          This service has not yet been deployed. Push a new commit to trigger a
          manual build.
        </p>
      </div>
    );
  }

  const deploymentElements = [];

  for (const deployment of deployments[0].reverse()) {
    const deploymentLog = fs.readFileSync(deployment.paths.logs, "utf8");

    let buildStatusColor;
    if (deployment.status.active) {
      buildStatusColor = "bg-emerald-500";
    } else if (!deployment.status.success) {
      buildStatusColor = "bg-red-500";
    } else {
      buildStatusColor = "bg-blue-500";
    }

    deploymentElements.push(
      <Surface
        key={deployment.build_id}
        className="flex flex-col gap-2 gap-4 rounded-lg border p-4 shadow-md"
      >
        <div className="flex flex-row">
          <div className="flex flex-row gap-4">
            <p>
              <span className="text-muted">Build Id:</span>
              {deployment.build_id}
            </p>

            <p>
              <span className="text-muted">Commit:</span>
              {deployment.commit}
            </p>
          </div>

          <div className="ml-auto">
            <div className="relative size-4">
              <div
                className={cn(
                  "absolute inset-0 animate-ping rounded-full",
                  buildStatusColor
                )}
              />
              <div
                className={cn(
                  "absolute inset-0 rounded-full",
                  buildStatusColor
                )}
              />
            </div>
          </div>
        </div>

        <pre className="bg-background rounded-lg p-4 font-mono wrap-break-word whitespace-pre-line">
          {deploymentLog}
        </pre>
      </Surface>
    );
  }

  return (
    <div className="flex w-full flex-col gap-16 p-12">{deploymentElements}</div>
  );
}
