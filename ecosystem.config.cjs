/**
 * PM2: run Next.js `output: "standalone"` from the traced bundle root.
 * After `npm run build`, use: `pm2 reload ecosystem.config.cjs --update-env`
 *
 * cwd must be `.next/standalone` so `/_next/static/*` and `public/*` resolve.
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
