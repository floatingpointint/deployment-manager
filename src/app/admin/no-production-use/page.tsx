import { Surface } from "@heroui/react";

import LockKeyholeSquareIcon from "@/components/svg/icons/auth/LockKeyholeSquareIcon";

export default function Home() {
  return (
    <div className="flex h-dvh w-full flex-col items-center justify-center">
      <Surface className="flex min-h-full min-w-full flex-col items-center justify-center gap-10 rounded-none border-2 p-12 sm:min-h-0 sm:w-96 sm:min-w-0 sm:rounded-2xl sm:px-8 sm:py-16 md:w-md">
        <LockKeyholeSquareIcon className="text-muted dark:text-segment size-48" />

        <div className="flex flex-col items-center gap-2">
          <h1 className="text-muted text-2xl font-bold">No Production Use</h1>

          <p className="text-muted text-center text-balance">
            This route has not been enabled for production use. If you are the
            maintainer of this server, please add the{" "}
            <span className="font-mono font-semibold tracking-wide">
              ALLOW_ADMIN_IN_PRODUCTION
            </span>{" "}
            environment variable.
          </p>
        </div>
      </Surface>
    </div>
  );
}
