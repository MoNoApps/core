const fs = require("node:fs");
const path = require("node:path");

const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath) && typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(envPath);
  } catch {}
}

require("tsx/cjs");
const { startServer } = require("./src/server");
const { api } = require("./api/routes");
const { svr } = require("./web/routes");

// Core Full-Stack Bootstrap

if (require.main === module) {
  startServer().catch((err) => {
    console.error("[Core] Startup failed:", err);
    process.exit(1);
  });
}

module.exports = { startServer, api, svr };
