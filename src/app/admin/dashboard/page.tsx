import { cn, Link, Surface } from "@heroui/react";
import Image from "next/image";
import { connection } from "next/server";

import getAllDeployments from "@utils/functions/getAllDeployments";
import getAllServiceConfigs from "@utils/functions/getAllServiceConfigs";

import CalendarIcon from "@/components/svg/icons/auth/CalendarIcon";
import CodeSquare01Icon from "@/components/svg/icons/auth/CodeSquare01Icon";
import CommitIcon from "@/components/svg/icons/auth/CommitIcon";
import { serviceBuildStates } from "@/config/states";

export const instant = false;

export default async function Home() {
  await connection();

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

    const buildStats = [
      <div key="branch" className="flex h-4 flex-row gap-1">
        <CodeSquare01Icon className="text-muted/40 shrink-0" size={12} />
        <Link
          className="text-muted truncate text-xs"
          href={branchUrl}
          target="_blank"
        >
          {`${service.remote.name}:${service.remote.branch}`}
        </Link>
      </div>,

      <div key="commit" className="flex h-4 flex-row gap-1">
        <CommitIcon className="text-muted/40 shrink-0" size={12} />
        <Link className="text-muted text-xs" href={commitUrl} target="_blank">
          {buildIdInUse ? `${buildIdInUse.commit.slice(0, 7)}` : `Not Active`}
        </Link>
      </div>,
      <div key="uptime" className="flex h-4 flex-row gap-1">
        <CalendarIcon className="text-muted/40 shrink-0" size={12} />
        <Link className="text-muted text-xs" href={commitUrl} target="_blank">
          {buildIdInUse
            ? `${humanizeTime(new Date(parseInt(buildIdInUse.build_id, 32)))}`
            : `Never`}
        </Link>
      </div>,
    ];

    servicesElementsList.push(
      <div key={service.process_id} className=" ">
        <Surface className="relative flex max-w-xl flex-1 flex-col items-center gap-6 rounded-2xl p-8">
          <Link
            className="absolute size-full"
            href={`/admin/services/${service.process_id}`}
          />

          <div className="flex h-18 w-full flex-row justify-start gap-8 sm:h-24">
            <div className="flex h-full shrink-0 items-center justify-center">
              <Image
                alt="GitHub Logo"
                className="hidden size-18 rounded-lg dark:block"
                height={288}
                src={"/github_logo/white.png"}
                width={294}
              />

              <Image
                alt="GitHub Logo"
                className="size-18 rounded-lg dark:hidden"
                height={288}
                src={"/github_logo/black.png"}
                width={294}
              />
            </div>

            <div className="flex min-w-0 flex-col">
              <div className="flex flex-col gap-1">
                <h2 className="truncate text-2xl font-bold">{service.name}</h2>
                <p className="text-muted font-mono text-sm tracking-wide">
                  {service.process_id}
                </p>
              </div>

              <div className="z-10 mt-auto hidden flex-row gap-3 sm:flex">
                {buildStats}
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
          </div>

          <div className="flex w-full flex-row place-content-center justify-around gap-3 sm:hidden">
            {buildStats}
          </div>
        </Surface>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-row flex-wrap justify-center gap-12 p-12 lg:p-24">
      {servicesElementsList}
    </div>
  );
}

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function humanizeTime(date: Date): string {
  const seconds = (date.getTime() - Date.now()) / 1000;
  const abs = Math.abs(seconds);

  if (abs < 60) return rtf.format(Math.round(seconds), "second");
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), "hour");
  if (abs < 2592000) return rtf.format(Math.round(seconds / 86400), "day");
  if (abs < 31536000) return rtf.format(Math.round(seconds / 2592000), "month");

  return rtf.format(Math.round(seconds / 31536000), "year");
}
