const { describe, it } = require("node:test");
const assert = require("node:assert");
const filters = require("../helpers/filters");

var user = {
  name: "MoNoApps LLC",
  email: "rruner@acme.co",
  password: "my secret password",
  token: "a1b2c4",
};
var spec = { name: "MoNoApps LLC", email: "rruner@acme.co" };
var toClean = { password: 1, token: 1 };

describe("Filters", function () {
  describe("clean", function () {
    it("should remove password and token withoud errors", function () {
      filters.cleanerFilter(user, toClean, function (err, res) {
        assert.equal(false, err);
        assert.equal("MoNoApps LLC", res.name);
        assert.equal("rruner@acme.co", res.email);
        assert.equal(null, res.password);
        assert.equal(null, res.token);
      });
    });
  });
});
