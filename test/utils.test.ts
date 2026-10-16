import { describe, it } from "node:test";
import assert from "node:assert";
import * as utils from "../helpers/utils";

describe("Utils (Node 24 Crypto & Promises)", () => {
  describe("createUUID", () => {
    it("should generate a valid v4 UUID string using native crypto.randomUUID()", () => {
      const uuid = utils.createUUID();
      assert.strictEqual(typeof uuid, "string");
      assert.strictEqual(uuid.length, 36);
      assert.match(
        uuid,
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });
  });

  describe("encryptString & decryptString", () => {
    it("should encrypt and decrypt plaintext symmetrically", () => {
      const secret = "SuperSecretKey99";
      const plaintext = "Hello Core 2026";
      const encrypted = utils.encryptString(plaintext, secret);
      assert.notStrictEqual(encrypted, plaintext);

      const decrypted = utils.decryptString(encrypted, secret);
      assert.strictEqual(decrypted, plaintext);
    });

    it("decryptString should return empty string on invalid cipher text", () => {
      const decrypted = utils.decryptString("invalid_hex_string", "secret");
      assert.strictEqual(decrypted, "");
    });
  });

  describe("createPwd & comparePwd", () => {
    it("should correctly hash and verify passwords using try/catch controlled logic", () => {
      const key = utils.createUUID();
      const rawPassword = "SecurePassword2026!";

      const { pwd, text } = utils.createPwd({ key, text: rawPassword });
      assert.strictEqual(text, rawPassword);
      assert.ok(pwd.value);
      assert.ok(pwd.type);

      const isValid = utils.comparePwd({ key, text: rawPassword }, pwd);
      assert.strictEqual(isValid, true);

      const isInvalid = utils.comparePwd({ key, text: "WrongPassword" }, pwd);
      assert.strictEqual(isInvalid, false);
    });

    it("should support callback for createPwd", (_t, done) => {
      const key = utils.createUUID();
      utils.createPwd({ key, text: "CbPassword" }, (pwd, text) => {
        assert.strictEqual(text, "CbPassword");
        assert.ok(pwd.value);
        done();
      });
    });

    it("should support callback for comparePwd", (_t, done) => {
      const key = utils.createUUID();
      const { pwd } = utils.createPwd({ key, text: "Secret1" });

      utils.comparePwd({ key, text: "Secret1" }, pwd, (isMatch) => {
        assert.strictEqual(isMatch, true);
        done();
      });
    });

    it("should handle missing password arguments gracefully without crashing", () => {
      const isInvalid = utils.comparePwd({ key: "test" }, null as any);
      assert.strictEqual(isInvalid, false);

      let cbCalled = false;
      const isInvalidWithCb = utils.comparePwd(
        { key: "test" },
        null as any,
        (match) => {
          cbCalled = true;
          assert.strictEqual(match, false);
        },
      );
      assert.strictEqual(isInvalidWithCb, false);
      assert.strictEqual(cbCalled, true);
    });

    it("should handle error in comparePwd gracefully", () => {
      let cbCalled = false;
      const result = utils.comparePwd(
        null as any,
        { value: "abc", type: "def" },
        (match) => {
          cbCalled = true;
          assert.strictEqual(match, false);
        },
      );
      assert.strictEqual(result, false);
      assert.strictEqual(cbCalled, true);
    });
  });

  describe("safeEqual", () => {
    it("should return false when lengths differ", () => {
      assert.strictEqual(utils.safeEqual("abc", "abcdef"), false);
    });

    it("should return false on falsy arguments", () => {
      assert.strictEqual(utils.safeEqual("", "a"), false);
      assert.strictEqual(utils.safeEqual(null as any, "a"), false);
    });
  });

  describe("Token Operations", () => {
    it("should create token async and via callback", async () => {
      const { models } = await import("../helpers/models");
      const origInsert = models.tokens.insert;
      try {
        models.tokens.insert = async (doc: any) => ({
          _id: "token_123",
          user: doc.user,
          expires: doc.expires,
        });

        const user: any = { _id: "usr_456" };
        const tok = await utils.createTokenAsync(user);
        assert.strictEqual(tok.user, "usr_456");

        await new Promise<void>((resolve, reject) => {
          utils.createToken(user, (err, rst) => {
            if (err) return reject(err);
            assert.strictEqual(rst?._id, "token_123");
            resolve();
          });
        });
      } finally {
        models.tokens.insert = origInsert;
      }
    });

    it("should handle createTokenAsync errors", async () => {
      const { models } = await import("../helpers/models");
      const origInsert = models.tokens.insert;
      try {
        models.tokens.insert = async () => {
          throw new Error("DB Error");
        };

        const user: any = { _id: "usr_456" };
        await assert.rejects(
          async () => {
            await utils.createTokenAsync(user);
          },
          { message: /Token creation failed: DB Error/ },
        );

        await new Promise<void>((resolve) => {
          utils.createToken(user, (err) => {
            assert.ok(err);
            resolve();
          });
        });
      } finally {
        models.tokens.insert = origInsert;
      }
    });

    it("should revoke token and handle errors", async () => {
      const { models } = await import("../helpers/models");
      const origDeleteById = models.tokens.deleteById;
      try {
        models.tokens.deleteById = async (id: any) => id === "good_token";
        assert.strictEqual(await utils.revokeToken("good_token"), true);
        assert.strictEqual(await utils.revokeToken("bad_token"), false);

        models.tokens.deleteById = async () => {
          throw new Error("fail");
        };
        assert.strictEqual(await utils.revokeToken("err_token"), false);
      } finally {
        models.tokens.deleteById = origDeleteById;
      }
    });

    it("should revoke tokens for user and handle errors", async () => {
      const { models } = await import("../helpers/models");
      const origDelete = models.tokens.delete;
      try {
        models.tokens.delete = async (filter: any) =>
          filter.user === "user_good";
        assert.strictEqual(await utils.revokeTokensForUser("user_good"), true);
        assert.strictEqual(await utils.revokeTokensForUser("user_bad"), false);

        models.tokens.delete = async () => {
          throw new Error("fail");
        };
        assert.strictEqual(await utils.revokeTokensForUser("user_err"), false);
      } finally {
        models.tokens.delete = origDelete;
      }
    });
  });
});
