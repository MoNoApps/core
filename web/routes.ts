import express, { type Express } from "express";
import { createServer, type Server as HTTPServer } from "http";
import path from "path";
import * as inspector from "../helpers/inspector";
import * as middleware from "../helpers/middleware";
import { api } from "../api/routes";

export const web: Express = express();
export const svr: HTTPServer = createServer(web);

const publicDir = path.resolve(process.cwd(), "public");
const distDir = path.resolve(publicDir, "dist");
const distIndex = path.resolve(distDir, "index.html");

// Plugin static public assets
inspector.addPluginsWeb(web, express.static);

// Static assets serving
web.use(express.static(distDir, { index: false }));
web.use(express.static(publicDir, { index: false }));
web.use(middleware.robots);
web.use(middleware.browser);

// Mount REST API service under /api for standalone & dev modes
web.use("/api", api);

// Main root landing page - serve React 19 SPA
web.get("/", (_req: express.Request, res: express.Response) => {
  res.sendFile(distIndex);
});

// SPA catch-all fallback for React 19 client-side routing
web.use(
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.method === "GET" && req.accepts("html")) {
      res.sendFile(distIndex);
      return;
    }
    next();
  },
);

export default {
  web,
  svr,
};
