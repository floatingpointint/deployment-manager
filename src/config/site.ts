export type SiteConfig = typeof siteConfig;

const siteConfig = {
  name: "Deployment Manager",
  description: "Node.js + PM2 Deployment Manager",
} as const;

export default siteConfig;
