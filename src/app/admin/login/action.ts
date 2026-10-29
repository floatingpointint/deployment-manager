"use server";

import "server-only";

import crypto from "crypto";

import { cookies } from "next/headers";

import ENV from "@/utils/environment/variables";

export async function testPassword(password: string) {
  const cookieStore = await cookies();

  if (ENV.ADMIN_PASSWORD === undefined) return false;

  const hash = (value: string) =>
    crypto.createHash("sha256").update(value, "utf8").digest();

  const isValid = crypto.timingSafeEqual(
    hash(ENV.ADMIN_PASSWORD),
    hash(password)
  );

  if (isValid) {
    cookieStore.set({
      name: "admin_session",
      value: hash(password).toString("hex"),
      path: "/admin",

      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
  }

  return isValid;
}
