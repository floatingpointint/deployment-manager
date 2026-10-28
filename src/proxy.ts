import { NextResponse } from "next/server";

export const config = {
  matcher: ["/((?!(?:_next|_vercel))(?!.*\\.(?:png|jpg|ico|svg|json|txt)$).*)"],
};

export default async function proxy() {
  return NextResponse.next();
}
