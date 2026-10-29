"use client";
import "client-only";

import { Button, FieldError, Input, Surface, TextField } from "@heroui/react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import LogIn04Icon from "@/components/svg/icons/auth/LogIn04Icon";

import { testPassword } from "./action";

export default function Home() {
  const [isInvalid, setIsInvalid] = useState(false);
  const [password, setPassword] = useState("");

  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex h-dvh w-full flex-col items-center justify-center">
      <Surface className="flex min-h-full min-w-full flex-col items-center justify-center gap-10 rounded-none border-2 p-12 sm:min-h-0 sm:w-96 sm:min-w-0 sm:rounded-2xl sm:px-8 sm:py-16 md:w-md">
        <LogIn04Icon className="text-muted dark:text-segment size-48" />

        <div className="flex flex-col items-center gap-2">
          <h1 className="text-muted text-2xl font-bold">Login Required</h1>

          <p className="text-muted text-center text-balance">
            This route requires you to be signed in. Please enter your
            administrative credentials to continue.
          </p>
        </div>

        <TextField
          className="flex h-10 w-full flex-col gap-4 px-4"
          isInvalid={isInvalid}
        >
          <div className="flex flex-row gap-4">
            <Input
              aria-label="Administrative password"
              className="h-full flex-1 rounded-lg"
              id="input-type-password"
              placeholder="••••••••"
              type="password"
              value={password}
              variant="secondary"
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              className="h-full rounded-lg"
              variant="secondary"
              onClick={onClick}
            >
              Submit
            </Button>
          </div>

          <FieldError>Password did not match.</FieldError>
        </TextField>
      </Surface>
    </div>
  );

  async function onClick() {
    const isValid = await testPassword(password);
    setIsInvalid(!isValid);

    if (isValid) {
      if (pathname !== "/admin/login") {
        router.refresh();
      } else {
        router.push("/admin/dashboard");
      }
    }
  }
}
