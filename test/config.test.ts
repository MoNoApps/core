import { describe, it } from "node:test";
import assert from "node:assert";
import { loadConfig, ConfigSchema } from "../src/config";

describe("Config Loader (Zod Schema Validation)", () => {
  it("should validate and parse configuration successfully", () => {
    const cfg = loadConfig();
    assert.ok(cfg.site);
    assert.strictEqual(typeof cfg.port.web, "number");
    assert.strictEqual(typeof cfg.port.api, "number");
    assert.ok(cfg.resources.users);
  });

  it("should enforce default fallback values if missing", () => {
    const parsed = ConfigSchema.parse({
      port: { web: 1344, api: 1345 },
    });
    assert.strictEqual(parsed.site, "Core");
    assert.strictEqual(parsed.TTL, 84000);
  });

  it("should fail validation if mail is provided without required 'from' address", () => {
    const result = ConfigSchema.safeParse({
      port: { web: 1344, api: 1345 },
      mail: { name: "Test Mailer" },
    });
    assert.strictEqual(result.success, false);
  });

  it("should succeed validation if mail has required 'from' address", () => {
    const result = ConfigSchema.safeParse({
      port: { web: 1344, api: 1345 },
      mail: { from: "test@example.com", name: "Test Mailer" },
    });
    assert.strictEqual(result.success, true);
  });

  it("should override ports and dburl via environment variables", () => {
    const origMongo = process.env.MONGODB_URI;
    const origPortWeb = process.env.PORT_WEB;
    const origPortApi = process.env.PORT_API;
    const origPortRedis = process.env.PORT_REDIS;

    try {
      process.env.MONGODB_URI = "mongodb://custom-db:27017/override";
      process.env.PORT_WEB = "2344";
      process.env.PORT_API = "2345";
      process.env.PORT_REDIS = "6380";

      const cfg = loadConfig();
      assert.strictEqual(cfg.dburl, "mongodb://custom-db:27017/override");
      assert.strictEqual(cfg.port.web, 2344);
      assert.strictEqual(cfg.port.api, 2345);
      assert.strictEqual(cfg.port.rds, 6380);
    } finally {
      if (origMongo !== undefined) process.env.MONGODB_URI = origMongo;
      else delete process.env.MONGODB_URI;

      if (origPortWeb !== undefined) process.env.PORT_WEB = origPortWeb;
      else delete process.env.PORT_WEB;

      if (origPortApi !== undefined) process.env.PORT_API = origPortApi;
      else delete process.env.PORT_API;

      if (origPortRedis !== undefined) process.env.PORT_REDIS = origPortRedis;
      else delete process.env.PORT_REDIS;
    }
  });

  it("should load base URL from BASE_URL environment variable", () => {
    const origBase = process.env.BASE_URL;
    try {
      process.env.BASE_URL = "https://app.example.com";
      const cfg = loadConfig();
      assert.strictEqual(cfg.URL?.BASE, "https://app.example.com");
    } finally {
      if (origBase !== undefined) process.env.BASE_URL = origBase;
      else delete process.env.BASE_URL;
    }
  });
});
