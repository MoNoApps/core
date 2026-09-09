import { describe, it } from "node:test";
import assert from "node:assert";
import * as filters from "../helpers/filters";

const user = {
  name: "MoNoApps LLC",
  email: "rruner@acme.co",
  password: "my secret password",
  token: "a1b2c4",
};
const toClean = { password: 1, token: 1 };

describe("Filters", () => {
  describe("clean", () => {
    it("should remove password and token without errors", () => {
      filters.cleanerFilter(user, toClean, (err, res: any) => {
        assert.strictEqual(err, false);
        assert.strictEqual(res.name, "MoNoApps LLC");
        assert.strictEqual(res.email, "rruner@acme.co");
        assert.strictEqual(res.password, undefined);
        assert.strictEqual(res.token, undefined);
      });
    });
  });
});
