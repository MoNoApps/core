import { describe, it } from "node:test";
import assert from "node:assert";
import * as auth from "../api/auth";
import { models } from "../helpers/models";
import * as utils from "../helpers/utils";

describe("Authentication & Credential Verification Suite (api/auth.ts)", () => {
  describe("getGravatarURL", () => {
    it("should generate standard gravatar URL with MD5 hash", () => {
      const url = auth.getGravatarURL("test@example.com");
      assert.ok(url.startsWith("https://secure.gravatar.com/avatar/"));
      assert.ok(url.includes("?size=50"));
    });
  });

  describe("isPwdOK & isPwdOKAsync", () => {
    it("should return false if user does not exist", async () => {
      const origFindOne = models.users.findOne;
      try {
        models.users.findOne = async () => null;
        const res = await auth.isPwdOKAsync("nobody@example.com", "pwd");
        assert.strictEqual(res.isValid, false);
      } finally {
        models.users.findOne = origFindOne;
      }
    });

    it("should return true and generate token on correct password", async () => {
      const origFindOne = models.users.findOne;
      const origTokenInsert = models.tokens.insert;
      try {
        models.tokens.insert = async (doc: any) => ({
          ...doc,
          _id: "mock_token_id",
        });
        const userId = "507f1f77bcf86cd799439088";
        const { pwd } = utils.createPwd({
          key: userId,
          text: "CorrectPassword123!",
        });
        models.users.findOne = async () =>
          ({
            _id: userId,
            email: "pwd_ok@example.com",
            password: pwd,
          }) as any;

        const res = await auth.isPwdOKAsync(
          "pwd_ok@example.com",
          "CorrectPassword123!",
        );
        assert.strictEqual(res.isValid, true);
        assert.ok(res.token);
      } finally {
        models.users.findOne = origFindOne;
        models.tokens.insert = origTokenInsert;
      }
    });

    it("should return false on wrong password", async () => {
      const origFindOne = models.users.findOne;
      try {
        const userId = "507f1f77bcf86cd799439099";
        const { pwd } = utils.createPwd({
          key: userId,
          text: "CorrectPassword123!",
        });
        models.users.findOne = async () =>
          ({
            _id: userId,
            email: "pwd_wrong@example.com",
            password: pwd,
          }) as any;

        const res = await auth.isPwdOKAsync(
          "pwd_wrong@example.com",
          "WrongPassword!",
        );
        assert.strictEqual(res.isValid, false);
      } finally {
        models.users.findOne = origFindOne;
      }
    });

    it("should support legacy callback for isPwdOK", (_t, done) => {
      const origFindOne = models.users.findOne;
      const origTokenInsert = models.tokens.insert;
      models.tokens.insert = async (doc: any) => ({
        ...doc,
        _id: "mock_cb_token_id",
      });
      const userId = "507f1f77bcf86cd799439077";
      const { pwd } = utils.createPwd({ key: userId, text: "CallbackPwd123!" });
      models.users.findOne = async () =>
        ({
          _id: userId,
          email: "cb_pwd@example.com",
          password: pwd,
        }) as any;

      auth.isPwdOK(
        "cb_pwd@example.com",
        "CallbackPwd123!",
        (err, isValid, token) => {
          models.users.findOne = origFindOne;
          models.tokens.insert = origTokenInsert;
          assert.strictEqual(err, null);
          assert.strictEqual(isValid, true);
          assert.ok(token);
          done();
        },
      );
    });
  });
});
