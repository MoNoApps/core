import { z } from "zod";
import rawConfig from "../config.json";

const ResourceConfigSchema = z
  .object({
    admin: z.boolean().optional(),
    param: z.string().optional(),
    clean: z.record(z.string(), z.any()).optional(),
    exclude: z.boolean().optional(),
    schema: z.record(z.string(), z.any()).optional(),
    desc: z.string().optional(),
  })
  .passthrough();

export const ConfigSchema = z.object({
  dburl: z.string().default("mongodb://127.0.0.1:27017/coreapp"),
  site: z.string().default("Core App"),
  theme: z.string().optional(),
  port: z.object({
    web: z.number().default(1344),
    api: z.number().default(1345),
    rds: z.number().optional().default(6379),
  }),
  mail: z
    .object({
      from: z.string(),
      name: z.string().optional(),
    })
    .optional(),
  guest: z
    .object({
      email: z.string(),
      text: z.string(),
      status: z.number().default(1),
      admin: z.boolean().default(false),
      enabled: z.boolean().default(false),
    })
    .optional(),
  autoform: z.boolean().optional(),
  INDEX: z.string().default("index/index"),
  ALLOW: z.array(z.string()).default(["127.0.0.1"]),
  TTL: z.number().default(84000),
  URL: z
    .object({
      BASE: z.string().default("http://localhost:1344"),
      ACK: z.string().default("/api/email/confirm/"),
      REC: z.string().default("/api/email/recover/"),
    })
    .optional(),
  APIVARS: z
    .object({
      PRE: z.string().default("/"),
      ID: z.string().default("/:id"),
      PLUGINS: z.object({
        DIR: z.string().default("/plugins"),
        MAIN: z.string().default("/plugin.js"),
        VIEWS: z.string().default("/views"),
        CONFIG: z.string().default("/config.json"),
      }),
    })
    .optional(),
  plugins: z.array(z.string()).default([]),
  pages: z.array(z.string()).default([]),
  resources: z.record(z.string(), ResourceConfigSchema).default({}),
});

export type AppConfig = z.infer<typeof ConfigSchema>;

export function loadConfig(): AppConfig {
  const merged = {
    ...rawConfig,
    dburl: process.env.MONGODB_URI || rawConfig.dburl,
    port: {
      web:
        Number(process.env.PORT || process.env.PORT_WEB) || rawConfig.port?.web,
      api: Number(process.env.PORT_API) || rawConfig.port?.api,
      rds: Number(process.env.PORT_REDIS) || rawConfig.port?.rds,
    },
    mail: rawConfig.mail
      ? {
          ...rawConfig.mail,
          from: process.env.MAIL_FROM || rawConfig.mail.from,
          name: process.env.MAIL_NAME || rawConfig.mail.name,
        }
      : undefined,
    guest: rawConfig.guest
      ? {
          ...rawConfig.guest,
          email: process.env.GUEST_EMAIL || rawConfig.guest.email,
          text: process.env.GUEST_PASSWORD || rawConfig.guest.text,
        }
      : undefined,
    URL: {
      ...rawConfig.URL,
      BASE: process.env.BASE_URL || rawConfig.URL?.BASE,
    },
  };

  const parsed = ConfigSchema.safeParse(merged);
  if (!parsed.success) {
    console.error("Invalid configuration schema:", parsed.error.format());
    throw new Error("Configuration validation failed");
  }
  return parsed.data;
}

export const config = loadConfig();
export default config;
