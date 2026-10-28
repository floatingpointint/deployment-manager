import type { Metadata, Viewport } from "next";

import { cn } from "@heroui/styles";

import { geistMono, geistSans } from "@/config/fonts";
import siteConfig from "@/config/site";
import "@/styles/globals.css";

import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: { icon: "/git_merge_icon.svg",  },
  applicationName: siteConfig.name,
};

export const viewport: Viewport = {
  width: "device-width",
};

export default async function RootLayout(props: LayoutProps<"/">) {
  return (
    <html suppressHydrationWarning lang="en">
      <body
        suppressHydrationWarning // client side extensions
        className={cn(
          "bg-background text-foreground h-full font-sans antialiased",
          geistSans.variable,
          geistMono.variable
        )}
      >
        <Providers> {props.children}</Providers>
      </body>
    </html>
  );
}
