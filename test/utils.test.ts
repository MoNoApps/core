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

    it("should handle missing password arguments gracefully without crashing", () => {
      const isInvalid = utils.comparePwd({ key: "test" }, null as any);
      assert.strictEqual(isInvalid, false);
    });
  });
});
