import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { safeEqual, createUUID, createPwd, comparePwd } from "../helpers/utils";
import { sanitizeObject, rateLimit } from "../helpers/middleware";
import { api } from "../api/routes";

describe("Security Hardening & Regression Test Suite", () => {
  let server: any;
  const TEST_PORT = 19454;
  const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

  before(async () => {
    await new Promise((resolve) => {
      server = api.listen(TEST_PORT, () => resolve(true));
    });
  });

  after(async () => {
    if (server && typeof server.close === "function") {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  describe("Cryptography & Timing Safety", () => {
    it("safeEqual should match identical strings and reject different strings", () => {
      assert.strictEqual(safeEqual("secret_hash_123", "secret_hash_123"), true);
      assert.strictEqual(
        safeEqual("secret_hash_123", "secret_hash_999"),
        false,
      );
      assert.strictEqual(safeEqual("short", "longer_string"), false);
      assert.strictEqual(safeEqual("", ""), true);
    });

    it("comparePwd should verify passwords using constant-time evaluation", () => {
      const { pwd, text } = createPwd({ key: "test-secret-key" });
      const isValid = comparePwd({ key: "test-secret-key", text }, pwd);
      assert.strictEqual(isValid, true);

      const isInvalid = comparePwd(
        { key: "test-secret-key", text: "wrong-password" },
        pwd,
      );
      assert.strictEqual(isInvalid, false);
    });
  });

  describe("HTTP Security Headers & CORS", () => {
    it("should respond with nosniff and frame protection headers", async () => {
      const res = await fetch(`${BASE_URL}/ping`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get("x-content-type-options"), "nosniff");
      assert.strictEqual(res.headers.get("x-frame-options"), "SAMEORIGIN");
      assert.strictEqual(
        res.headers.get("referrer-policy"),
        "strict-origin-when-cross-origin",
      );
    });
  });

  describe("NoSQL Injection & Input Sanitization", () => {
    it("sanitizeObject should recursively strip $ operator keys and dotted paths", () => {
      const maliciousPayload = {
        name: "Valid User",
        email: "user@example.com",
        $where: "function() { return true; }",
        $gt: "",
        nested: {
          role: "admin",
          $regex: ".*",
          "config.admin": true,
          details: {
            $ne: null,
            bio: "Hello world",
          },
        },
      };

      const sanitized = sanitizeObject(maliciousPayload);

      assert.strictEqual(sanitized.name, "Valid User");
      assert.strictEqual(sanitized.email, "user@example.com");
      assert.strictEqual("$where" in sanitized, false);
      assert.strictEqual("$gt" in sanitized, false);
      assert.strictEqual("$regex" in sanitized.nested, false);
      assert.strictEqual("config.admin" in sanitized.nested, false);
      assert.strictEqual("$ne" in sanitized.nested.details, false);
      assert.strictEqual(sanitized.nested.details.bio, "Hello world");
    });
  });

  describe("Rate Limiting Middleware", () => {
    it("should set standard rate limiting headers", async () => {
      const res = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "test" }),
      });
      assert.ok(res.headers.has("ratelimit-limit"));
      assert.ok(res.headers.has("ratelimit-remaining"));
    });
  });
});
