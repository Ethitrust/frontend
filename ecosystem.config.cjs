/**
 * PM2: run Next.js `output: "standalone"` from the traced bundle root.
 * After `npm run build`, use: `pm2 reload ecosystem.config.cjs --update-env`
 */
const path = require("path");

const standaloneRoot = path.join(__dirname, ".next", "standalone");

module.exports = {
  apps: [
    {
      name: "ethitrust",
      cwd: standaloneRoot,
      script: "server.js",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        HOSTNAME: "0.0.0.0",
      },
    },
  ],
};
