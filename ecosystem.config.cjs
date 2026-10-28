module.exports = {
  apps: [
    {
      name: "deployment-manager",
      script: "npm",
      args: "run start",

      max_memory_restart: "1000M",
      exp_backoff_restart_delay: 10_000,

      max_restarts: 3,
      min_uptime: 60_000,
    },
  ],
};
