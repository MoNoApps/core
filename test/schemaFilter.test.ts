import { describe, it } from "node:test";
import assert from "node:assert";
import * as filters from "../helpers/filters";

const userA = { name: "" };
const userB = { author: "", date: Date.now() };
const userC = { admin: "", date: Date.now() };
const userD = { name: "", date: Date.now() };

const schema = { name: true, date: true, hologram: true };

describe("Filters", () => {
  describe("schema", () => {
    it("should be valid with just name", () => {
      filters.schemaFilter(userA, schema, (err, res) => {
        assert.strictEqual(err, false);
        assert.strictEqual(res, null);
      });
    });

    it("should return error indicating author not allowed", () => {
      filters.schemaFilter(userB, schema, (err, res) => {
        assert.strictEqual(err, "Property author in target not allowed");
        assert.strictEqual(res, undefined);
      });
    });

    it("should return error indicating admin not allowed", () => {
      filters.schemaFilter(userC, schema, (err, res) => {
        assert.strictEqual(err, "Property admin in target not allowed");
        assert.strictEqual(res, undefined);
      });
    });

    it("should be valid with name and date", () => {
      filters.schemaFilter(userD, schema, (err, res) => {
        assert.strictEqual(err, false);
        assert.strictEqual(res, null);
      });
    });
  });
});
