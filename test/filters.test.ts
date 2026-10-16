import { describe, it } from "node:test";
import assert from "node:assert";
import * as filters from "../helpers/filters";
import * as manager from "../helpers/manager";
import { models } from "../helpers/models";

describe("Filters & Response Manager Unit Suite (helpers/filters.ts & helpers/manager.ts)", () => {
  describe("matchFilter", () => {
    it("should return true when property matches value", () => {
      const target = { role: "admin", status: 1 };
      const res = filters.matchFilter(target, "role", "admin");
      assert.strictEqual(res, true);
    });

    it("should return false when property does not match value", () => {
      const target = { role: "user" };
      const res = filters.matchFilter(target, "role", "admin");
      assert.strictEqual(res, false);
    });

    it("should support callback when property matches", (_t, done) => {
      const target = { active: true };
      filters.matchFilter(target, "active", true, (err) => {
        assert.strictEqual(err, false);
        done();
      });
    });

    it("should support callback when property does not match", (_t, done) => {
      const target = { active: false };
      filters.matchFilter(target, "active", true, (err) => {
        assert.strictEqual(err, "Value does not match.");
        done();
      });
    });
  });

  describe("adminFilter & checkAdmin", () => {
    it("checkAdmin should return true for admin users and false otherwise", () => {
      assert.strictEqual(
        filters.checkAdmin({ email: "admin@example.com", admin: true }),
        true,
      );
      assert.strictEqual(
        filters.checkAdmin({ email: "user@example.com", admin: false }),
        false,
      );
      assert.strictEqual(
        filters.checkAdmin({ email: "anon@example.com" }),
        false,
      );
    });

    it("adminFilter should return true for admin and pass false to callback", (_t, done) => {
      const adminUser = { email: "admin@example.com", admin: true };
      const res = filters.adminFilter(adminUser, (isNotAdmin) => {
        assert.strictEqual(isNotAdmin, false);
        done();
      });
      assert.strictEqual(res, true);
    });

    it("adminFilter should return false for non-admin and pass true to callback", (_t, done) => {
      const regularUser = { email: "user@example.com", admin: false };
      const res = filters.adminFilter(regularUser, (isNotAdmin) => {
        assert.strictEqual(isNotAdmin, true);
        done();
      });
      assert.strictEqual(res, false);
    });
  });

  describe("cleanObject & cleanerFilter", () => {
    it("cleanObject should clean an array of objects", () => {
      const items = [
        { id: 1, secret: "s1", name: "one" },
        { id: 2, secret: "s2", name: "two" },
      ];
      const cleaned = filters.cleanObject(items, { secret: 1 });
      assert.ok(Array.isArray(cleaned));
      assert.strictEqual(cleaned.length, 2);
      assert.strictEqual(cleaned[0].secret, undefined);
      assert.strictEqual(cleaned[1].secret, undefined);
      assert.strictEqual(cleaned[0].name, "one");
    });
  });

  describe("authFilter", () => {
    it("should respond 401 when tokenId is invalid or short", async () => {
      let sentCode = 0;
      const mockRes = {
        send: (code: number) => {
          sentCode = code;
        },
      };

      const res = await filters.authFilter(mockRes, "short");
      assert.strictEqual(res, null);
      assert.strictEqual(sentCode, 401);
    });
  });

  describe("manager.response", () => {
    it("should send 500 when err property is provided", () => {
      let statusCode = 0;
      let payload: any = null;
      const mockRes = {
        status: (code: number) => {
          statusCode = code;
          return {
            json: (data: any) => {
              payload = data;
            },
            send: (data: any) => {
              payload = data;
            },
          };
        },
      };

      manager.response({ res: mockRes, err: "Failed operation" });
      assert.strictEqual(statusCode, 500);
      assert.strictEqual(payload.error, "Failed operation");
    });

    it("should send 404 when rsp is undefined or null", () => {
      let statusCode = 0;
      let payload: any = null;
      const mockRes = {
        status: (code: number) => {
          statusCode = code;
          return {
            json: (data: any) => {
              payload = data;
            },
          };
        },
      };

      manager.response({ res: mockRes, rsp: null });
      assert.strictEqual(statusCode, 404);
      assert.strictEqual(payload.message, "Not Found");
    });

    it("should send 200 OK when rsp equals 1", () => {
      let statusCode = 0;
      let payload: any = null;
      const mockRes = {
        status: (code: number) => {
          statusCode = code;
          return {
            json: (data: any) => {
              payload = data;
            },
          };
        },
      };

      manager.response({ res: mockRes, rsp: 1 });
      assert.strictEqual(statusCode, 200);
      assert.strictEqual(payload.message, "OK");
    });

    it("should strip clean fields when clean option is provided", () => {
      let statusCode = 0;
      let payload: any = null;
      const mockRes = {
        status: (code: number) => {
          statusCode = code;
          return {
            json: (data: any) => {
              payload = data;
            },
          };
        },
      };

      manager.response({
        res: mockRes,
        rsp: { id: "item1", secret: "super_secret" },
        clean: { secret: 1 },
      });
      assert.strictEqual(statusCode, 200);
      assert.strictEqual(payload.secret, undefined);
      assert.strictEqual(payload.id, "item1");
    });
  });

  describe("manager.review", () => {
    it("should return null and send 401 when token is missing", async () => {
      let statusCode = 0;
      let payload: any = null;
      const mockRes = {
        status: (code: number) => {
          statusCode = code;
          return {
            json: (data: any) => {
              payload = data;
            },
          };
        },
      };

      const result = await manager.review({
        req: { params: {}, headers: {} },
        res: mockRes,
      });
      assert.strictEqual(result, null);
      assert.strictEqual(statusCode, 401);
      assert.strictEqual(payload.error, "Missing token");
    });

    it("should handle invalid token and expired token in review", async () => {
      let statusCode = 0;
      let payload: any = null;
      const mockRes = {
        status: (code: number) => {
          statusCode = code;
          return {
            json: (d: any) => {
              payload = d;
            },
          };
        },
      };

      // Invalid token format
      const res1 = await manager.review({
        req: { headers: { token: "short_invalid" } },
        res: mockRes,
      });
      assert.strictEqual(res1, null);
      assert.strictEqual(statusCode, 401);
      assert.strictEqual(payload.error, "Invalid token");
    });

    it("should reject non-admin users when admin flag is true", async () => {
      let statusCode = 0;
      let payload: any = null;
      const mockRes = {
        status: (code: number) => {
          statusCode = code;
          return {
            json: (d: any) => {
              payload = d;
            },
          };
        },
      };

      const tokenId = "507f1f77bcf86cd799439011";
      const origTokensFind = models.tokens.findById;
      const origUsersFind = models.users.findById;

      models.tokens.findById = async () =>
        ({
          _id: tokenId,
          user: "u1",
          createdAt: Date.now(),
          expires: 84000,
        }) as any;
      models.users.findById = async () =>
        ({
          _id: "u1",
          email: "u@t.co",
          admin: false,
        }) as any;

      const res = await manager.review({
        req: { headers: { token: tokenId } },
        res: mockRes,
        admin: true,
      });
      assert.strictEqual(res, null);
      assert.strictEqual(statusCode, 401);
      assert.strictEqual(payload.error, "Admin access required");

      models.tokens.findById = origTokensFind;
      models.users.findById = origUsersFind;
    });

    it("should enforce schema validation when schema flag is true", async () => {
      let statusCode = 0;
      let payload: any = null;
      const mockRes = {
        status: (code: number) => {
          statusCode = code;
          return {
            json: (d: any) => {
              payload = d;
            },
          };
        },
      };

      const tokenId = "507f1f77bcf86cd799439011";
      const origTokensFind = models.tokens.findById;
      const origUsersFind = models.users.findById;

      models.tokens.findById = async () =>
        ({
          _id: tokenId,
          user: "u1",
          createdAt: Date.now(),
          expires: 84000,
        }) as any;
      models.users.findById = async () =>
        ({
          _id: "u1",
          email: "u@t.co",
          admin: true,
        }) as any;

      // Disallowed property "hacker"
      const res = await manager.review({
        req: {
          headers: { token: tokenId },
          body: { hacker: true, token: "del" },
        },
        res: mockRes,
        schema: true,
        handler: { schema: { title: 1 } },
      });
      assert.strictEqual(res, null);
      assert.strictEqual(statusCode, 401);
      assert.ok(payload.error.includes("hacker"));

      // Valid schema with callback
      let cbCalled = false;
      const validRes = await manager.review(
        {
          req: { headers: { token: tokenId }, body: { title: "Valid Title" } },
          res: mockRes,
          schema: true,
          handler: { schema: { title: 1 } },
        },
        (err) => {
          assert.strictEqual(err, null);
          cbCalled = true;
        },
      );
      assert.ok(validRes);
      assert.strictEqual(cbCalled, true);

      models.tokens.findById = origTokensFind;
      models.users.findById = origUsersFind;
    });

    it("should handle expired token in review", async () => {
      let statusCode = 0;
      let payload: any = null;
      const mockRes = {
        status: (code: number) => {
          statusCode = code;
          return {
            json: (d: any) => {
              payload = d;
            },
          };
        },
      };

      const tokenId = "507f1f77bcf86cd799439011";
      const origTokensFind = models.tokens.findById;
      const origTokensDelete = models.tokens.deleteById;
      const origUsersFind = models.users.findById;

      models.tokens.findById = async () =>
        ({
          _id: tokenId,
          user: "u1",
          createdAt: new Date(Date.now() - 200000 * 1000),
          expires: 84000,
        }) as any;
      models.tokens.deleteById = async () => true;
      models.users.findById = async () =>
        ({
          _id: "u1",
          email: "u@t.co",
        }) as any;

      const res = await manager.review({
        req: { headers: { token: tokenId } },
        res: mockRes,
      });
      assert.strictEqual(res, null);
      assert.strictEqual(statusCode, 401);
      assert.strictEqual(payload.error, "Token expired");

      models.tokens.findById = origTokensFind;
      models.tokens.deleteById = origTokensDelete;
      models.users.findById = origUsersFind;
    });

    it("should handle error catch in review and call callback with error", async () => {
      let statusCode = 0;
      let payload: any = null;
      const mockRes = {
        status: (code: number) => {
          statusCode = code;
          return {
            json: (d: any) => {
              payload = d;
            },
          };
        },
      };

      let errorReceived: any = null;
      const throwingReq = {
        get headers() {
          throw new Error("Header parse error");
        },
      };

      const res = await manager.review(
        {
          req: throwingReq as any,
          res: mockRes,
        },
        (err) => {
          errorReceived = err;
        },
      );
      assert.strictEqual(res, null);
      assert.strictEqual(statusCode, 401);
      assert.strictEqual(payload.error, "Authentication failed");
      assert.strictEqual(errorReceived?.message, "Header parse error");
    });
  });

  describe("manager.response & sendStatus edges", () => {
    it("should handle legacy res.send(code, payload)", () => {
      let sentCode = 0;
      let sentData: any = null;
      const legacyRes = {
        send: (code: number, payload: any) => {
          sentCode = code;
          sentData = payload;
        },
      };

      manager.response({ res: legacyRes, rsp: { hello: "world" } });
      assert.strictEqual(sentCode, 200);
      assert.deepStrictEqual(sentData, { hello: "world" });
    });

    it("should send string payload with send()", () => {
      let sentCode = 0;
      let sentBody = "";
      const mockRes = {
        status: (code: number) => {
          sentCode = code;
          return {
            send: (body: string) => {
              sentBody = body;
            },
          };
        },
      };

      manager.response({ res: mockRes, rsp: "Plain text response" });
      assert.strictEqual(sentCode, 200);
      assert.strictEqual(sentBody, "Plain text response");
    });

    it("should catch errors in response formatting and return 500", () => {
      let sentCode = 0;
      let sentPayload: any = null;
      const mockRes = {
        status: (code: number) => {
          sentCode = code;
          return {
            json: (data: any) => {
              sentPayload = data;
            },
          };
        },
      };

      // Property getter that throws
      const throwingRsp = {};
      Object.defineProperty(throwingRsp, "secret", {
        get() {
          throw new Error("Serialization error");
        },
        enumerable: true,
      });

      manager.response({
        res: mockRes,
        rsp: throwingRsp,
        clean: { secret: 1 },
      });
      assert.strictEqual(sentCode, 500);
      assert.strictEqual(sentPayload.error, "Internal Server Error");
    });
  });
});
