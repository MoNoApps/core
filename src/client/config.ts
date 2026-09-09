import rawConfig from "../../config.json";
import type { AppConfig } from "./types/index";

export const config: AppConfig = rawConfig as AppConfig;
export default config;
