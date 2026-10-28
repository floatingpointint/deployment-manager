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
} as const;

export default ENV;
