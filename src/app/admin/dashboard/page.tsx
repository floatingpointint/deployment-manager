import { cn, Link, Surface } from "@heroui/react";
import Image from "next/image";

import getAllDeployments from "@utils/functions/getAllDeployments";
import getAllServiceConfigs from "@utils/functions/getAllServiceConfigs";

import CodeSquare01Icon from "@/components/svg/icons/auth/CodeSquare01Icon";
import CommitIcon from "@/components/svg/icons/auth/CommitIcon";
import { serviceBuildStates } from "@/config/states";

export const instant = false;

export default async function Home() {
  const services = await getAllServiceConfigs();
  const deployments = await getAllDeployments();

  const servicesElementsList = [];

  for (const service of services) {
    const buildIdInUse = deployments[service.process_id]?.find(
      (deployment) => deployment.status.active
    );

    const lastBuildAttempted =
      deployments[service.process_id]?.[
        (deployments[service.process_id]?.length ?? 1) - 1
      ];

    let buildStatusColor;
    if (serviceBuildStates.has(service.process_id)) {
      buildStatusColor = "bg-amber-500";
    } else if (
      buildIdInUse &&
      lastBuildAttempted &&
      buildIdInUse.build_id === lastBuildAttempted.build_id
    ) {
      buildStatusColor = "bg-emerald-500";
    } else if (lastBuildAttempted) {
      buildStatusColor = "bg-red-500";
    } else {
      buildStatusColor = "bg-gray-500";
    }

    const branchUrl = `https://github.com/${service.remote.name}/tree/${service.remote.branch}`;

    let commitUrl;
    if (buildIdInUse) {
      commitUrl = `https://github.com/${service.remote.name}/commit/${buildIdInUse.commit}`;
    } else {
      commitUrl = `https://github.com/${service.remote.name}/commits/${service.remote.branch}`;
    }

    servicesElementsList.push(
      <Link
        key={service.process_id}
        className="size-fit w-full no-underline transition-transform hover:scale-[1.02] active:scale-100"
      >
        <Surface className="flex h-38 w-full flex-row justify-start gap-8 rounded-xl p-6">
          <div className="flex h-full shrink-0 items-center justify-center">
            <Image
              alt="GitHub Logo"
              className="hidden size-24 rounded-lg dark:block"
              height={288}
              src={"/github_logo/white.png"}
              width={294}
            />

            <Image
              alt="GitHub Logo"
              className="size-24 rounded-lg dark:hidden"
              height={288}
              src={"/github_logo/black.png"}
              width={294}
            />
          </div>

          <div className="f flex min-w-0 flex-col">
            <div className="flex flex-col gap-1">
              <h2 className="truncate text-2xl font-bold">{service.name}</h2>
              <p className="text-muted font-mono text-sm tracking-wide">
                {`${service.process_id}/${buildIdInUse?.build_id ?? "NA"}`}
              </p>
            </div>

            <div className="mt-auto flex flex-row gap-3">
              <div className="flex h-4 flex-row gap-1">
                <CodeSquare01Icon className="text-muted/40" size={12} />
                <Link
                  className="text-muted text-xs"
                  href={branchUrl}
                  target="_blank"
                >
                  {`${service.remote.name}:${service.remote.branch}`}
                </Link>
              </div>

              <div className="flex h-4 flex-row gap-1">
                <CommitIcon className="text-muted/40" size={12} />
                <Link
                  className="text-muted text-xs"
                  href={commitUrl}
                  target="_blank"
                >
                  {buildIdInUse
                    ? `${buildIdInUse.commit.slice(0, 7)}`
                    : `Not Active`}
                </Link>
              </div>
            </div>
          </div>

          <div className="ml-auto">
            <div className="relative size-3">
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
        </Surface>
      </Link>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-12 p-12 lg:grid-cols-2 lg:p-24 2xl:grid-cols-3">
      {servicesElementsList}
    </div>
  );
}
