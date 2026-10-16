import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { api } from "../api/routes";
import { models } from "../helpers/models";
import { controllers } from "../api/controllers";
import * as utils from "../helpers/utils";
import { closeRedis } from "../helpers/ps";

describe("API Integration Test Suite (Node 24 Native Fetch)", () => {
  let server: any;
  const TEST_PORT = 19452;
  const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

  const testUserId = "507f1f77bcf86cd799439077";
  const validTokenId = "507f1f77bcf86cd799439066";

  const { pwd: validPwdHash } = utils.createPwd({
    key: testUserId,
    text: "UserPassword123!",
  });

  const testUser = {
    _id: testUserId,
    email: "api_user@example.com",
    name: "API User",
    admin: false,
    password: validPwdHash,
  };

  before(async () => {
    // Mock user model operations
    models.users.findOne = async (filter: any) => {
      if (filter.email === testUser.email) return testUser as any;
      return null;
    };

    models.users.findById = async (id: any) => {
      if (id.toString() === testUserId) return testUser as any;
      return null;
    };

    models.users.insert = async (doc: any) => ({ ...doc, _id: "mock_user_id" });
    models.users.update = async () => true;
    models.users.updateById = async () => true;
    models.tokens.insert = async (doc: any) => ({
      ...doc,
      _id: "new_token_id",
    });

    models.tokens.findById = async (tokenId: any) => {
      if (tokenId.toString() === validTokenId) {
        return {
          _id: validTokenId,
          token: validTokenId,
          user: testUserId,
          createdAt: new Date(),
          expires: 84000,
        } as any;
      }
      return null;
    };

    controllers.settings.getOne = async () =>
      ({
        data: {
          user: ["resources_user"],
          admin: ["resources_admin"],
        },
      }) as any;

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

  it("GET / should respond with 200 OK", async () => {
    const res = await fetch(`${BASE_URL}/`);
    assert.strictEqual(res.status, 200);
    const text = await res.text();
    assert.strictEqual(text, "OK");
  });

  it("GET /ping should respond with 200 OK", async () => {
    const res = await fetch(`${BASE_URL}/ping`);
    assert.strictEqual(res.status, 200);
    const text = await res.text();
    assert.strictEqual(text, "OK");
  });

  it("GET /theme should return 404 since theme endpoint is deprecated and removed", async () => {
    const res = await fetch(`${BASE_URL}/theme`);
    assert.strictEqual(res.status, 404);
  });

  it("GET /guest should return 404 since guest endpoint is purged", async () => {
    const res = await fetch(`${BASE_URL}/guest`);
    assert.strictEqual(res.status, 404);
  });

  it("POST /login without payload should return 401 Unauthorized", async () => {
    const res = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.strictEqual(res.status, 401);
  });

  it("POST /login with valid credentials should succeed", async () => {
    const res = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testUser.email,
        password: "UserPassword123!",
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = (await res.json()) as any;
    assert.ok(data.token);
    assert.ok(data.gravatar);
  });

  it("POST /login with wrong password should return 401", async () => {
    const res = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testUser.email,
        password: "WrongPassword!",
      }),
    });
    assert.strictEqual(res.status, 401);
  });

  it("GET /properties with valid token should return permitted resources", async () => {
    const res = await fetch(`${BASE_URL}/properties`, {
      headers: { token: validTokenId },
    });
    assert.strictEqual(res.status, 200);
    const data = (await res.json()) as any;
    assert.ok(data.resources);
  });

  it("POST /account with valid user token should update profile", async () => {
    const res = await fetch(`${BASE_URL}/account`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        token: validTokenId,
      },
      body: JSON.stringify({ name: "Updated Name" }),
    });
    assert.strictEqual(res.status, 200);
  });
});
