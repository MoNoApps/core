import fs from "fs";
import path from "path";
import * as generator from "./generator";
import config from "../config.json";

const plugins = config.plugins || [];
const pconf = config.APIVARS?.PLUGINS || {
  DIR: "/plugins",
  MAIN: "/plugin.js",
  VIEWS: "/views",
  CONFIG: "/config.json",
};
const pluginsDir = path.resolve(process.cwd(), pconf.DIR.replace(/^\//, ""));

function apiParams(defRoute: {
  params?: Record<string, unknown> | string[];
}): string {
  let defParams = "";
  if (defRoute.params) {
    if (Array.isArray(defRoute.params)) {
      for (const param of defRoute.params) {
        if (param) defParams += `/:${param}`;
      }
    } else {
      for (const param of Object.keys(defRoute.params)) {
        if (param) defParams += `/:${param}`;
      }
    }
  }
  return defParams;
}

export function addPluginsApi(
  api: any,
  controllersMap: Record<string, any> = {},
): void {
  for (const name of plugins) {
    const prefix = `/${name}`;
    const mainPath = path.join(pluginsDir, name, pconf.MAIN.replace(/^\//, ""));
    const configPath = path.join(
      pluginsDir,
      name,
      pconf.CONFIG.replace(/^\//, ""),
    );

    if (!fs.existsSync(mainPath) || !fs.existsSync(configPath)) {
      continue;
    }

    try {
      const plugin = require(mainPath);
      const pluginConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));

      if (plugin.api?.GET) {
        for (const g of Object.keys(plugin.api.GET)) {
          const defGET = plugin.api.GET[g];
          api.get(`${prefix}/${defGET.route}${apiParams(defGET)}`, defGET.fn);
        }
      }

      if (plugin.api?.POST) {
        for (const p of Object.keys(plugin.api.POST)) {
          const defPOST = plugin.api.POST[p];
          api.post(
            `${prefix}/${defPOST.route}${apiParams(defPOST)}`,
            defPOST.fn,
          );
        }
      }

      if (plugin.api?.DELETE) {
        for (const d of Object.keys(plugin.api.DELETE)) {
          const defDELETE = plugin.api.DELETE[d];
          const delMethod =
            typeof api.del === "function"
              ? api.del.bind(api)
              : api.delete.bind(api);
          delMethod(
            `${prefix}/${defDELETE.route}${apiParams(defDELETE)}`,
            defDELETE.fn,
          );
        }
      }

      if (plugin.api?.PUT) {
        for (const t of Object.keys(plugin.api.PUT)) {
          const defPUT = plugin.api.PUT[t];
          api.put(`${prefix}/${defPUT.route}${apiParams(defPUT)}`, defPUT.fn);
        }
      }

      if (pluginConfig.resources) {
        addResourceRoutes(pluginConfig.resources, api, controllersMap);
      }
    } catch (err) {
      console.warn(`[addPluginsApi] Error loading plugin ${name}:`, err);
    }
  }
}

export function addResourceRoutes(
  resources: Record<string, any>,
  api: any,
  controllersMap: Record<string, any> = {},
): void {
  for (const route of Object.keys(resources)) {
    const resourceDef = resources[route];
    if (resourceDef.exclude) {
      continue;
    }

    generator.addRoutes({
      api,
      route,
      admin: resourceDef.admin,
      controller: controllersMap[route],
      schema: resourceDef.schema,
      clean: resourceDef.clean,
    });
  }
}

function getViewPath(name: string): string {
  return path.join(pluginsDir, name, pconf.VIEWS.replace(/^\//, ""));
}

export function addPluginsWeb(web: any, expressStatic: any): string[] {
  const views: string[] = [];

  for (const name of plugins) {
    const prefix = `/${name}`;
    const configPath = path.join(
      pluginsDir,
      name,
      pconf.CONFIG.replace(/^\//, ""),
    );

    if (!fs.existsSync(configPath)) {
      continue;
    }

    try {
      const pluginConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
      views.push(getViewPath(name));
      web.use(expressStatic(path.join(pluginsDir, name, "public")));

      if (pluginConfig.pages) {
        for (const page of pluginConfig.pages) {
          generator.addPage(web, page);
        }
      }

      if (pluginConfig.resources) {
        for (const route of Object.keys(pluginConfig.resources)) {
          generator.addView(web, route);
        }
      }
    } catch (err) {
      console.warn(
        `[addPluginsWeb] Error loading plugin web assets for ${name}:`,
        err,
      );
    }
  }

  return views;
}

export default {
  addPluginsApi,
  addPluginsWeb,
  addResourceRoutes,
};
