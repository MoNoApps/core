import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { api } from "../api/routes";
import { models } from "../helpers/models";
import * as utils from "../helpers/utils";
import { closeRedis } from "../helpers/ps";

describe("Authentication & Account Lifecycle Suite", () => {
  let server: any;
  const TEST_PORT = 19456;
  const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

  const testUserId = "507f1f77bcf86cd799439044";
  const testSessionTokenId = "507f1f77bcf86cd799439033";
  const testExpiredTokenId = "507f1f77bcf86cd799439055";
  const testAdminTokenId = "507f1f77bcf86cd799439077";
  const testAdminUserId = "507f1f77bcf86cd799439088";

  const initialPassword = "MyInitialPassword123!";
  const { pwd: initialPwdHash } = utils.createPwd({
    key: testUserId,
    text: initialPassword,
  });

  const testUser = {
    _id: testUserId,
    email: "auth_test@example.com",
    name: "Auth Test User",
    admin: false,
    password: initialPwdHash,
  };

  const testAdminUser = {
    _id: testAdminUserId,
    email: "admin_test@example.com",
    name: "Admin User",
    admin: true,
    password: initialPwdHash,
  };

  before(async () => {
    models.tokens.findById = async (tokenId: any) => {
      const idStr = tokenId.toString();
      if (idStr === testSessionTokenId) {
        return {
          _id: testSessionTokenId,
          token: testSessionTokenId,
          user: testUserId,
          createdAt: new Date(),
          expires: 84000,
        } as any;
      }
      if (idStr === testAdminTokenId) {
        return {
          _id: testAdminTokenId,
          token: testAdminTokenId,
          user: testAdminUserId,
          createdAt: new Date(),
          expires: 84000,
        } as any;
      }
      if (idStr === testExpiredTokenId) {
        return {
          _id: testExpiredTokenId,
          token: testExpiredTokenId,
          user: testUserId,
          createdAt: new Date(Date.now() - 200000 * 1000), // Created 200k seconds ago
          expires: 84000,
        } as any;
      }
      return null;
    };

    models.tokens.deleteById = async () => true;

    models.users.findById = async (userId: any) => {
      const idStr = userId.toString();
      if (idStr === testUserId) return testUser as any;
      if (idStr === testAdminUserId) return testAdminUser as any;
      return null;
    };

    models.users.findOne = async (query: any) => {
      if (query.email === testUser.email) return testUser as any;
      if (query.email === testAdminUser.email) return testAdminUser as any;
      return null;
    };

    // Mock updateById on users collection
    models.users.updateById = async (_id: any, updateDoc: any) => {
      if (updateDoc.$set?.password) {
        testUser.password = updateDoc.$set.password;
      }
      if (updateDoc.$set?.name) {
        testUser.name = updateDoc.$set.name;
      }
      return true;
    };

    models.users.insert = async (doc: any) =>
      ({ ...doc, _id: "new_usr_id" }) as any;
    models.users.update = async () => true;

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

  it("GET /account without token should return 401 Missing token", async () => {
    const res = await fetch(`${BASE_URL}/account`);
    assert.strictEqual(res.status, 401);
  });

  it("GET /account with valid token should return user profile without password", async () => {
    const res = await fetch(`${BASE_URL}/account`, {
      headers: { token: testSessionTokenId },
    });
    assert.strictEqual(res.status, 200);
    const profile = (await res.json()) as any;
    assert.strictEqual(profile.email, "auth_test@example.com");
    assert.strictEqual(profile.name, "Auth Test User");
    assert.strictEqual(profile.password, undefined);
  });

  it("GET /account with expired token should return 401 Token expired (Issue #14)", async () => {
    const res = await fetch(`${BASE_URL}/account`, {
      headers: { token: testExpiredTokenId },
    });
    assert.strictEqual(res.status, 401);
    const body = (await res.json()) as any;
    assert.strictEqual(body.error, "Token expired");
  });

  it("GET /account with forged or non-existent token should return 401 Invalid token", async () => {
    const res = await fetch(`${BASE_URL}/account`, {
      headers: { token: "507f1f77bcf86cd799439099" },
    });
    assert.strictEqual(res.status, 401);
    const body = (await res.json()) as any;
    assert.strictEqual(body.error, "Invalid token");
  });

  it("POST /security with mismatched password confirmation should return 401", async () => {
    const res = await fetch(`${BASE_URL}/security`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        token: testSessionTokenId,
      },
      body: JSON.stringify({
        password: initialPassword,
        newPwd: "NewSecretPassword123!",
        again: "DoesNotMatchPassword!",
      }),
    });
    assert.strictEqual(res.status, 401);
    const body = (await res.json()) as any;
    assert.strictEqual(body.error, "Invalid password parameters");
  });

  it("POST /security with wrong current password should return 401", async () => {
    const res = await fetch(`${BASE_URL}/security`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        token: testSessionTokenId,
      },
      body: JSON.stringify({
        password: "IncorrectCurrentPassword!",
        newPwd: "NewSecretPassword123!",
        again: "NewSecretPassword123!",
      }),
    });
    assert.strictEqual(res.status, 401);
    const body = (await res.json()) as any;
    assert.strictEqual(body.error, "Current password does not match");
  });

  it("POST /security with correct current password should update password hash", async () => {
    const newPassword = "NewSecurePassword2026!";
    const res = await fetch(`${BASE_URL}/security`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        token: testSessionTokenId,
      },
      body: JSON.stringify({
        password: initialPassword,
        newPwd: newPassword,
        again: newPassword,
      }),
    });
    assert.strictEqual(res.status, 200);

    // Verify new password verifies against updated hash
    const isValid = utils.comparePwd(
      { key: testUserId, text: newPassword },
      testUser.password,
    );
    assert.strictEqual(isValid, true);
  });

  it("POST /security with missing body fields should return 401 Invalid password parameters", async () => {
    const res = await fetch(`${BASE_URL}/security`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        token: testSessionTokenId,
      },
      body: JSON.stringify({}),
    });
    assert.strictEqual(res.status, 401);
    const body = (await res.json()) as any;
    assert.strictEqual(body.error, "Invalid password parameters");
  });

  it("GET /guest should return 404 since guest endpoint is purged", async () => {
    const res = await fetch(`${BASE_URL}/guest`);
    assert.strictEqual(res.status, 404);
  });

  it("POST /account should update user profile", async () => {
    const res = await fetch(`${BASE_URL}/account`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        token: testSessionTokenId,
      },
      body: JSON.stringify({ name: "Updated Name" }),
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(testUser.name, "Updated Name");
  });

  it("GET /properties should handle user vs admin, missing data, and error 501", async () => {
    const { controllers } = await import("../api/controllers");
    const origGetOne = controllers.settings.getOne;
    try {
      // 1. Missing settings data
      controllers.settings.getOne = async () => null as any;
      const resEmpty = await fetch(`${BASE_URL}/properties`, {
        headers: { token: testSessionTokenId },
      });
      assert.strictEqual(resEmpty.status, 200);
      assert.deepStrictEqual(await resEmpty.json(), {});

      // 2. Normal user properties
      controllers.settings.getOne = async () =>
        ({
          data: {
            user: { docs: "user_view" },
            admin: { docs: "admin_view" },
          },
        }) as any;

      const resUser = await fetch(`${BASE_URL}/properties`, {
        headers: { token: testSessionTokenId },
      });
      assert.strictEqual(resUser.status, 200);
      const userBody = (await resUser.json()) as any;
      assert.deepStrictEqual(userBody.resources, { docs: "user_view" });
      assert.strictEqual(userBody.admin, undefined);

      // 3. Admin user properties
      const resAdmin = await fetch(`${BASE_URL}/properties`, {
        headers: { token: testAdminTokenId },
      });
      assert.strictEqual(resAdmin.status, 200);
      const adminBody = (await resAdmin.json()) as any;
      assert.deepStrictEqual(adminBody.resources, { docs: "admin_view" });

      // 4. Settings getOne error
      controllers.settings.getOne = async () => {
        throw new Error("DB crash");
      };
      const resErr = await fetch(`${BASE_URL}/properties`, {
        headers: { token: testSessionTokenId },
      });
      assert.strictEqual(resErr.status, 501);
    } finally {
      controllers.settings.getOne = origGetOne;
    }
  });

  it("should handle error edge cases in account and commons handlers directly", async () => {
    const account = await import("../api/account");
    const commons = await import("../api/commons");
    const { controllers } = await import("../api/controllers");

    let resData: any = null;
    const mockRes = {
      status: (code: number) => ({
        json: (data: any) => {
          resData = { code, data };
        },
        send: (data: any) => {
          resData = { code, data };
        },
      }),
      setHeader: () => {},
    };

    // account.update error handling: updateById throws
    const origUpdateById = controllers.users.updateById;
    try {
      controllers.users.updateById = async () => {
        throw new Error("Update failure");
      };
      const reqWithUser = {
        headers: { token: testSessionTokenId },
        params: {},
        body: { name: "Fail" },
      };
      await account.update(reqWithUser, mockRes);
      assert.ok(resData);

      // account.security error handling
      await account.security(reqWithUser, mockRes);
      assert.ok(resData);
    } finally {
      controllers.users.updateById = origUpdateById;
    }

    // commons.login validation error
    resData = null;
    await commons.login({ body: {} }, mockRes);
    assert.strictEqual(resData.code, 401);

    // account.find error catch
    const origFindById = models.users.findById;
    try {
      models.users.findById = async () => {
        return {
          get _id() {
            throw new Error("getter crash");
          },
        } as any;
      };
      await account.find(
        { headers: { token: testSessionTokenId }, params: {} },
        mockRes,
      );
      assert.ok(resData);

      // account.security error catch
      await account.security(
        {
          headers: { token: testSessionTokenId },
          params: {},
          body: {
            password: initialPassword,
            newPwd: "any",
            again: "any",
          },
        },
        mockRes,
      );
      assert.ok(resData);
    } finally {
      models.users.findById = origFindById;
    }
  });
});
