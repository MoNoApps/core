import fs from "fs";
import path from "path";
import { CBase } from "../helpers/base";
import { models, addModel } from "../helpers/models";
import config from "../config.json";

export const controllers: Record<string, CBase> = {};

export function defineModels(resourceNames: Record<string, any> = {}): void {
  for (const name of Object.keys(resourceNames)) {
    if (!models[name]) {
      addModel(name);
    }
    controllers[name] = new CBase(models[name]);
  }
}

export function defineModelsFromPlugins(): void {
  const plugins = config.plugins || [];
  const pconf = config.APIVARS?.PLUGINS || {
    DIR: "/plugins",
    CONFIG: "/config.json",
  };
  const pluginsDir = path.resolve(process.cwd(), pconf.DIR.replace(/^\//, ""));

  for (const pluginName of plugins) {
    const pluginConfigPath = path.join(
      pluginsDir,
      pluginName,
      pconf.CONFIG.replace(/^\//, ""),
    );
    if (fs.existsSync(pluginConfigPath)) {
      try {
        const pluginConfig = JSON.parse(
          fs.readFileSync(pluginConfigPath, "utf8"),
        );
        if (pluginConfig.resources) {
          defineModels(pluginConfig.resources);
        }
      } catch (err) {
        console.warn(
          `[controllers] Error loading plugin config ${pluginConfigPath}:`,
          err,
        );
      }
    }
  }
}

// Initialize standard core controllers
defineModels(config.resources || {});
defineModels({
  users: {},
  tokens: {},
  settings: {},
});
defineModelsFromPlugins();

export default controllers;
