import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { safeEqual, createPwd, comparePwd } from "../helpers/utils";
import { sanitizeObject, rateLimit } from "../helpers/middleware";
import { api } from "../api/routes";
import { closeRedis } from "../helpers/ps";

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
      server.closeAllConnections?.();
      await new Promise((resolve) => server.close(resolve));
    }
    try {
      await closeRedis();
    } catch {}
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

    it("should return 429 when rate limit is exceeded", () => {
      const limiter = rateLimit({
        windowMs: 1000,
        max: 2,
        message: "Rate limit exceeded",
      });
      const mockReq: any = { headers: {}, ip: "127.0.0.1", path: "/test" };
      let statusCode = 0;
      let jsonPayload: any = null;
      const mockRes: any = {
        setHeader: () => {},
        status: (code: number) => {
          statusCode = code;
          return {
            json: (data: any) => {
              jsonPayload = data;
            },
          };
        },
      };

      let nextCalled = 0;
      limiter(mockReq, mockRes, () => {
        nextCalled++;
      });
      limiter(mockReq, mockRes, () => {
        nextCalled++;
      });
      limiter(mockReq, mockRes, () => {
        nextCalled++;
      }); // 3rd request exceeds max=2

      assert.strictEqual(statusCode, 429);
      assert.strictEqual(jsonPayload.success, false);
      assert.strictEqual(jsonPayload.error, "Rate limit exceeded");
      assert.strictEqual(nextCalled, 2);
    });
  });

  describe("CORS, Browser, Robots & Trusted Guards", () => {
    const {
      corsGuard,
      browser,
      robots,
      trusted,
      sanitizeNoSql,
    } = require("../helpers/middleware");

    it("corsGuard should respond 204 on OPTIONS preflight", () => {
      let sentStatus = 0;
      const mockReq: any = {
        method: "OPTIONS",
        headers: { origin: "http://localhost:3000" },
      };
      const headers: Record<string, string> = {};
      const mockRes: any = {
        setHeader: (k: string, v: string) => {
          headers[k] = v;
        },
        sendStatus: (s: number) => {
          sentStatus = s;
        },
      };

      corsGuard(mockReq, mockRes, () => {});
      assert.strictEqual(sentStatus, 204);
      assert.strictEqual(
        headers["Access-Control-Allow-Origin"],
        "http://localhost:3000",
      );
    });

    it("corsGuard should allow wildcard when origin is absent", () => {
      const mockReq: any = { method: "GET", headers: {} };
      const headers: Record<string, string> = {};
      let nextCalled = false;
      const mockRes: any = {
        setHeader: (k: string, v: string) => {
          headers[k] = v;
        },
      };

      corsGuard(mockReq, mockRes, () => {
        nextCalled = true;
      });
      assert.strictEqual(headers["Access-Control-Allow-Origin"], "*");
      assert.strictEqual(nextCalled, true);
    });

    it("sanitizeNoSql should strip $ operators in req.query and req.body", () => {
      const mockReq: any = {
        query: { safe: "1", $where: "bad" },
        body: { name: "ok", $gt: "10" },
      };
      let nextCalled = false;
      sanitizeNoSql(mockReq, {} as any, () => {
        nextCalled = true;
      });
      assert.strictEqual(mockReq.query.$where, undefined);
      assert.strictEqual(mockReq.body.$gt, undefined);
      assert.strictEqual(mockReq.query.safe, "1");
      assert.strictEqual(nextCalled, true);
    });

    it("browser middleware should reject legacy user agents with 400", () => {
      let sentStatus = 0;
      let sentBody = "";
      const mockReq: any = {
        headers: {
          "user-agent": "Mozilla/4.0 (compatible; MSIE 2.0; Windows 95)",
        },
      };
      const mockRes: any = {
        status: (s: number) => {
          sentStatus = s;
          return {
            send: (b: string) => {
              sentBody = b;
            },
          };
        },
      };
      browser(mockReq, mockRes, () => {});
      assert.strictEqual(sentStatus, 400);
      assert.match(sentBody, /Browser not supported/);

      let nextCalled = false;
      const modernReq: any = {
        headers: { "user-agent": "Mozilla/5.0 Modern Browser" },
      };
      browser(modernReq, {} as any, () => {
        nextCalled = true;
      });
      assert.strictEqual(nextCalled, true);
    });

    it("robots middleware should call next on non-robots requests", () => {
      let nextCalled = false;
      const mockReq: any = { url: "/api/users" };
      robots(mockReq, {} as any, () => {
        nextCalled = true;
      });
      assert.strictEqual(nextCalled, true);
    });

    it("trusted middleware should allow allowed IPs and redirect untrusted IPs", () => {
      let nextCalled = false;
      const trustedReq: any = { headers: { "x-forwarded-for": "127.0.0.1" } };
      trusted(trustedReq, {} as any, () => {
        nextCalled = true;
      });
      assert.strictEqual(nextCalled, true);

      let redirectStatus = 0;
      let locationHeader = "";
      const untrustedReq: any = {
        headers: { "x-forwarded-for": "198.51.100.1" },
      };
      const mockRes: any = {
        header: (k: string, v: string) => {
          if (k === "Location") locationHeader = v;
        },
        sendStatus: (code: number) => {
          redirectStatus = code;
        },
      };
      trusted(untrustedReq, mockRes, () => {});
      assert.strictEqual(redirectStatus, 302);
      assert.ok(locationHeader);
    });
  });
});
