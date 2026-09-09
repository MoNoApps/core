var resources = require("../../config.json").resources;
var models = require("../../helpers/models");

module.exports = function (email, cb) {
  models.users.Remove(
    { email: email || "tester@monoapps.co" },
    function (err, ack) {
      if (err) {
        process.exit();
      }
      expect(err).toEqual(null);
      expect(ack.result.ok).toBe(1);
      cb();
    },
  );
};
