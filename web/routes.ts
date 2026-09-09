import express, { type Express } from "express";
import { createServer, type Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import path from "path";
import fs from "fs";
import * as generator from "../helpers/generator";
import * as inspector from "../helpers/inspector";
import * as middleware from "../helpers/middleware";
import config from "../config.json";

export const web: Express = express();
export const svr: HTTPServer = createServer(web);
export const sio: SocketIOServer = new SocketIOServer(svr);

const pages = config.pages || [];
const resources = config.resources || {};
const viewsDir = path.resolve(process.cwd(), "views");
const publicDir = path.resolve(process.cwd(), "public");

// Configure views and static assets
const pluginViews = inspector.addPluginsWeb(web, express.static);
const views = [...pluginViews, viewsDir];

const distDir = path.resolve(publicDir, "dist");
const distIndex = path.resolve(distDir, "index.html");

web.set("views", views);
web.set("view engine", "pug");
web.use(express.static(distDir));
web.use(express.static(publicDir));
web.use(middleware.robots);
web.use(middleware.browser);

// Auto-generated views for resources
for (const route of Object.keys(resources)) {
  generator.addView(web, route);
}

// Auto-generated pages
for (const page of pages) {
  generator.addPage(web, page);
}

// Main root landing page
web.get("/", (_req: express.Request, res: express.Response) => {
  if (fs.existsSync(distIndex)) {
    res.sendFile(distIndex);
  } else {
    res.render(config.INDEX || "index", {
      model: false,
      site: config.site,
      theme: config.theme,
    });
  }
});

// Dynamic template rendering
web.get("/templates/:name", (req: express.Request, res: express.Response) => {
  res.render(`templates/${req.params.name}`);
});

export default {
  web,
  svr,
  sio,
};
