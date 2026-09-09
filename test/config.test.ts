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
    assert.strictEqual(parsed.site, "Core App");
    assert.strictEqual(parsed.TTL, 84000);
  });

  it("should fail validation if mail is provided without required 'from' address", () => {
    const result = ConfigSchema.safeParse({
      port: { web: 1344, api: 1345 },
      mail: { name: "Test Mailer" },
    });
    assert.strictEqual(result.success, false);
  });

  it("should fail validation if guest is provided without required email/text", () => {
    const result = ConfigSchema.safeParse({
      port: { web: 1344, api: 1345 },
      guest: { status: 1 },
    });
    assert.strictEqual(result.success, false);
  });
});
