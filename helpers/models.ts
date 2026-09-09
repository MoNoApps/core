import fs from "fs";
import path from "path";
import config from "../config.json";
import { ModernModel } from "./db";

export const models: Record<string, ModernModel> = {};

export function addModel(name: string): ModernModel {
  if (!models[name]) {
    models[name] = new ModernModel(name);
  }
  return models[name];
}

export function initializeModels(): Record<string, ModernModel> {
  // Initialize models from core config resources
  if (config.resources) {
    for (const name of Object.keys(config.resources)) {
      addModel(name);
    }
  }

  // Ensure default core collections are registered
  addModel("users");
  addModel("tokens");
  addModel("settings");

  // Discover and initialize models from plugins
  const plugins = config.plugins || [];
  const pconf = config.APIVARS?.PLUGINS || {
    DIR: "/plugins",
    CONFIG: "/config.json",
  };
  const pluginsDir = path.resolve(process.cwd(), pconf.DIR.replace(/^\//, ""));

  for (const plugin of plugins) {
    const configPath = path.join(
      pluginsDir,
      plugin,
      pconf.CONFIG.replace(/^\//, ""),
    );
    if (fs.existsSync(configPath)) {
      try {
        const pluginConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
        if (pluginConfig.resources) {
          for (const resName of Object.keys(pluginConfig.resources)) {
            addModel(resName);
          }
        }
      } catch (err) {
        console.warn(
          `[initializeModels] Failed to load plugin config at ${configPath}:`,
          err,
        );
      }
    }
  }

  return models;
}

initializeModels();

export default models;
