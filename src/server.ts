import config from "../config.json";
import { api } from "../api/routes";
import { svr } from "../web/routes";
import * as sio from "../sio/routes";

const apiPort = Number(process.env.API_PORT) || config.port?.api || 1345;
const webPort =
  Number(process.env.PORT) ||
  Number(process.env.WEB_PORT) ||
  config.port?.web ||
  1344;

export async function startServer(): Promise<{
  apiServer: any;
  webServer: any;
}> {
  const apiServer = await new Promise((resolve) => {
    api.listen(apiPort, () => {
      console.log(
        `[MoNoApps Core] Restify API Server running on port ${apiPort}`,
      );
      resolve(api);
    });
  });

  const webServer = await new Promise((resolve) => {
    svr.listen(webPort, () => {
      console.log(
        `[MoNoApps Core] Express Web Server running on port ${webPort}`,
      );
      resolve(svr);
    });
  });

  sio.listen(() => {
    console.log(`[MoNoApps Core] Socket.IO Engine initialized`);
  });

  return { apiServer, webServer };
}

if (process.env.NODE_ENV !== "test" && require.main === module) {
  startServer().catch((err) => {
    console.error("[MoNoApps Core] Startup failed:", err);
    process.exit(1);
  });
}

export default startServer;
