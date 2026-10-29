import "server-only";

function env(name: string): string;
function env(name: string, optional: true): string | undefined;
function env(name: string, optional = false) {
  if (optional) return process.env[name];
  if (process.env[name]) return process.env[name];

  throw new Error(`${name} undefined`);
}

const ENV = {
  GITHUB_WEBHOOK_SECRET: env("GITHUB_WEBHOOK_SECRET"),
  ALLOW_ADMIN_IN_PRODUCTION: !!env("ALLOW_ADMIN_IN_PRODUCTION", true),
  ADMIN_PASSWORD: env("ADMIN_PASSWORD", true),
} as const;

export default ENV;
