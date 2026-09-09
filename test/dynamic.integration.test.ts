import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { api } from "../api/routes";
import { models } from "../helpers/models";
import * as filters from "../helpers/filters";

describe("Dynamic Resource CRUD & Security Guards Suite", () => {
  let server: any;
  const TEST_PORT = 19455;
  const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

  const regularUser = {
    _id: "user_regular_123",
    email: "regular@monoapps.co",
    admin: false,
  };

  const adminUser = {
    _id: "user_admin_999",
    email: "admin@monoapps.co",
    admin: true,
  };

  const adminTokenId = "507f1f77bcf86cd799439011";
  const regularTokenId = "507f1f77bcf86cd799439022";

  before(async () => {
    models.tokens.findById = async (tokenId: any) => {
      if (tokenId.toString() === adminTokenId) {
        return {
          _id: adminTokenId,
          token: adminTokenId,
          user: adminUser._id,
        } as any;
      }
      if (tokenId.toString() === regularTokenId) {
        return {
          _id: regularTokenId,
          token: regularTokenId,
          user: regularUser._id,
        } as any;
      }
      return null;
    };

    models.users.findById = async (userId: any) => {
      if (userId.toString() === adminUser._id) return adminUser as any;
      if (userId.toString() === regularUser._id) return regularUser as any;
      return null;
    };

    // Mock models.users.find to return raw documents containing sensitive fields
    models.users.find = async () => [
      {
        _id: "user_regular_123",
        name: "Test User",
        email: "regular@monoapps.co",
        password: "super_secret_hashed_password",
        token: "internal_session_token_xyz",
      } as any,
    ];

    await new Promise((resolve) => {
      server = api.listen(TEST_PORT, () => resolve(true));
    });
  });

  after(async () => {
    if (server && typeof server.close === "function") {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it("GET /users should reject request without token (401 Unauthorized)", async () => {
    const res = await fetch(`${BASE_URL}/users`);
    assert.strictEqual(res.status, 401);
    const body = (await res.json()) as any;
    assert.strictEqual(body.error, "Missing token");
  });

  it("GET /users should reject regular non-admin user (admin: true guard)", async () => {
    const res = await fetch(`${BASE_URL}/users`, {
      headers: { token: regularTokenId },
    });
    assert.strictEqual(res.status, 401);
    const body = (await res.json()) as any;
    assert.strictEqual(body.error, "Admin access required");
  });

  it("GET /users with admin token should succeed and strip sensitive clean fields", async () => {
    const res = await fetch(`${BASE_URL}/users`, {
      headers: { token: adminTokenId },
    });
    assert.strictEqual(res.status, 200);
    const list = (await res.json()) as any[];
    assert.ok(Array.isArray(list));
    assert.strictEqual(list.length, 1);
    // Verify cleaner filter stripped password
    assert.strictEqual(list[0].password, undefined);
  });

  it("PUT /users/:id with unauthorized property should fail schema validation", async () => {
    const res = await fetch(`${BASE_URL}/users/user_regular_123`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        token: adminTokenId,
      },
      body: JSON.stringify({ unauthorizedField: "malicious" }),
    });
    assert.strictEqual(res.status, 401);
    const body = (await res.json()) as any;
    assert.ok(
      body.error.includes("Property unauthorizedField in target not allowed"),
    );
  });
});
