"use server";
import "server-only";

import type { cookies } from "next/headers";

import crypto from "crypto";

import ENV from "@utils/environment/variables";

export default async function isSessionValid(
  cookieStore: Awaited<ReturnType<typeof cookies>>
) {
  if (ENV.ADMIN_PASSWORD === undefined) return false;

  const session = cookieStore.get("admin_session");
  if (session === undefined) return false;

  const hash = crypto.hash("sha256", ENV.ADMIN_PASSWORD, "hex");
  if (session.value !== hash) return false;

  return true;
}
