import { cookies } from "next/headers";

import ENV from "@utils/environment/variables";
import isSessionValid from "@utils/functions/isSessionValid";

import LoginPage from "./login/page";
import NoProductionUsePage from "./no-production-use/page";

export const instant = false;

export default async function Layout(props: LayoutProps<"/admin">) {
  if (!ENV.ALLOW_ADMIN_IN_PRODUCTION) {
    return <NoProductionUsePage />;
  }

  const isSignedIn = await isSessionValid(await cookies());
  if (!isSignedIn) {
    return <LoginPage />;
  }

  return <>{props.children}</>;
}
