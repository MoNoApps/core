import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { api } from "../api/routes";
import { models } from "../helpers/models";
import * as filters from "../helpers/filters";
import * as utils from "../helpers/utils";

describe("Authentication & Account Lifecycle Suite", () => {
  let server: any;
  const TEST_PORT = 19456;
  const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

  const testUserId = "507f1f77bcf86cd799439044";
  const testSessionTokenId = "507f1f77bcf86cd799439033";
  const initialPassword = "MyInitialPassword123!";
  const { pwd: initialPwdHash } = utils.createPwd({
    key: testUserId,
    text: initialPassword,
  });

  const testUser = {
    _id: testUserId,
    email: "auth_test@monoapps.co",
    name: "Auth Test User",
    admin: false,
    password: initialPwdHash,
  };

  before(async () => {
    models.tokens.findById = async (tokenId: any) => {
      if (tokenId.toString() === testSessionTokenId) {
        return {
          _id: testSessionTokenId,
          token: testSessionTokenId,
          user: testUserId,
        } as any;
      }
      return null;
    };

    models.users.findById = async (userId: any) => {
      if (userId.toString() === testUserId) {
        return testUser as any;
      }
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

    await new Promise((resolve) => {
      server = api.listen(TEST_PORT, () => resolve(true));
    });
  });

  after(async () => {
    if (server && typeof server.close === "function") {
      await new Promise((resolve) => server.close(resolve));
    }
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
    assert.strictEqual(profile.email, "auth_test@monoapps.co");
    assert.strictEqual(profile.name, "Auth Test User");
    assert.strictEqual(profile.password, undefined);
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
});
