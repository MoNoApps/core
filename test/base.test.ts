import { describe, it } from "node:test";
import assert from "node:assert";
import { CBase } from "../helpers/base";

describe("CBase Controller Wrapper (Async / Await & Promises)", () => {
  it("should initialize with default pagination and sorting", () => {
    const mockModel = {
      find: async () => [],
      findOne: async () => null,
    };
    const controller = new CBase(mockModel);
    assert.strictEqual(controller.size, 100);
    assert.deepStrictEqual(controller.sort, { createdAt: 1 });
  });

  it("should support async query operations with list", async () => {
    const mockData = [
      { _id: "1", title: "Test 1" },
      { _id: "2", title: "Test 2" },
    ];
    const mockModel = {
      find: async (_filter: any, opts: any) => {
        assert.strictEqual(opts.limit, 50);
        return mockData;
      },
    };

    const controller = new CBase(mockModel, 50);
    const results = await controller.list({});
    assert.strictEqual(results.length, 2);
    assert.strictEqual(results[0].title, "Test 1");
  });

  it("should support async getOne, findById, create, updateById, deleteById", async () => {
    const mockModel = {
      findOne: async (filter: any) => ({ _id: "10", email: filter.email }),
      findById: async (id: any) => ({ _id: id, name: "Item 10" }),
      insert: async (doc: any) => ({ ...doc, _id: "new_id" }),
      updateById: async () => true,
      deleteById: async () => true,
    };

    const controller = new CBase(mockModel);
    const user = await controller.getOne({ email: "test@example.com" });
    assert.strictEqual(user?.email, "test@example.com");

    const item = await controller.findById("10");
    assert.strictEqual(item?.name, "Item 10");

    const created = await controller.create({ name: "Created" });
    assert.strictEqual(created._id, "new_id");

    const updated = await controller.updateById("10", { name: "Updated" });
    assert.strictEqual(updated, true);

    const deleted = await controller.deleteById("10");
    assert.strictEqual(deleted, true);
  });

  it("should support callback based List operations for legacy compatibility", (_t, done) => {
    const mockData = [{ _id: "100", name: "Item 100" }];
    const mockModel = {
      find: async () => mockData,
    };

    const controller = new CBase(mockModel);
    controller.List({}, (err, res) => {
      assert.strictEqual(err, null);
      assert.strictEqual(res?.length, 1);
      assert.strictEqual(res?.[0].name, "Item 100");
      done();
    });
  });
});
