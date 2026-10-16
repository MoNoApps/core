import { describe, it } from "node:test";
import assert from "node:assert";
import { BaseController } from "../helpers/base";

describe("BaseController Controller Wrapper (Async / Await & Promises)", () => {
  it("should initialize with default pagination and sorting", () => {
    const mockModel = {
      find: async () => [],
      findOne: async () => null,
    };
    const controller = new BaseController(mockModel);
    assert.strictEqual(controller.size, 100);
    assert.deepStrictEqual(controller.sort, { createdAt: 1 });
  });

  it("should support async query operations with list and List callback", async () => {
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

    const controller = new BaseController(mockModel, 50);
    const results = await controller.list({});
    assert.strictEqual(results.length, 2);
    assert.strictEqual(results[0].title, "Test 1");

    await new Promise<void>((resolve) => {
      controller.List({}, (err, res) => {
        assert.strictEqual(err, null);
        assert.strictEqual(res?.length, 2);
        resolve();
      });
    });
  });

  it("should support async getOne and GetOne callback", async () => {
    const mockModel = {
      findOne: async (filter: any) => ({ _id: "10", email: filter.email }),
    };
    const controller = new BaseController(mockModel);
    const user = await controller.getOne({ email: "test@example.com" });
    assert.strictEqual(user?.email, "test@example.com");

    await new Promise<void>((resolve) => {
      controller.GetOne({ email: "test@example.com" }, (err, res) => {
        assert.strictEqual(err, null);
        assert.strictEqual(res?.email, "test@example.com");
        resolve();
      });
    });
  });

  it("should support async findById and FindById callback", async () => {
    const mockModel = {
      findById: async (id: any) => ({ _id: id, name: "Item 10" }),
    };
    const controller = new BaseController(mockModel);
    const item = await controller.findById("10");
    assert.strictEqual(item?.name, "Item 10");

    await new Promise<void>((resolve) => {
      controller.FindById("10", (err, res) => {
        assert.strictEqual(err, null);
        assert.strictEqual(res?.name, "Item 10");
        resolve();
      });
    });
  });

  it("should support async create and Create callback", async () => {
    const mockModel = {
      insert: async (doc: any) => ({ ...doc, _id: "new_id" }),
    };
    const controller = new BaseController(mockModel);
    const created = await controller.create({ name: "Created" });
    assert.strictEqual(created._id, "new_id");

    await new Promise<void>((resolve) => {
      controller.Create({ name: "Created" }, (err, res) => {
        assert.strictEqual(err, null);
        assert.strictEqual(res?._id, "new_id");
        resolve();
      });
    });
  });

  it("should support update, Update, updateById, UpdateById", async () => {
    let updatedFilter: any = null;
    let updatedById: any = null;
    const mockModel = {
      update: async (filter: any) => {
        updatedFilter = filter;
        return true;
      },
      updateById: async (id: any) => {
        updatedById = id;
        return true;
      },
    };
    const controller = new BaseController(mockModel);

    const u1 = await controller.update({ status: 1 }, { status: 2 });
    assert.strictEqual(u1, true);
    assert.deepStrictEqual(updatedFilter, { status: 1 });

    await new Promise<void>((resolve) => {
      controller.Update({ status: 2 }, { status: 3 }, (err, res) => {
        assert.strictEqual(err, null);
        assert.strictEqual(res, true);
        resolve();
      });
    });

    const u2 = await controller.updateById("id_1", { name: "New" });
    assert.strictEqual(u2, true);
    assert.strictEqual(updatedById, "id_1");

    await new Promise<void>((resolve) => {
      controller.UpdateById("id_2", { name: "New 2" }, (err, res) => {
        assert.strictEqual(err, null);
        assert.strictEqual(res, true);
        resolve();
      });
    });
  });

  it("should support updateByIdAndQuery and UpdateByIdAndQuery callback", async () => {
    let capturedFilter: any = null;
    const mockModel = {
      update: async (filter: any) => {
        capturedFilter = filter;
        return true;
      },
    };
    const controller = new BaseController(mockModel);
    const validHexId = "507f1f77bcf86cd799439011";

    const res = await controller.updateByIdAndQuery(
      validHexId,
      { name: "Test" },
      { active: true },
    );
    assert.strictEqual(res, true);
    assert.strictEqual(capturedFilter.active, true);
    assert.strictEqual(capturedFilter._id.toString(), validHexId);

    await new Promise<void>((resolve) => {
      controller.UpdateByIdAndQuery(
        validHexId,
        { name: "Test" },
        { active: true },
        (err, ok) => {
          assert.strictEqual(err, null);
          assert.strictEqual(ok, true);
          resolve();
        },
      );
    });
  });

  it("should support delete, Delete, deleteById, DeleteById", async () => {
    let deletedFilter: any = null;
    let deletedId: any = null;
    const mockModel = {
      delete: async (filter: any) => {
        deletedFilter = filter;
        return true;
      },
      deleteById: async (id: any) => {
        deletedId = id;
        return true;
      },
    };
    const controller = new BaseController(mockModel);

    const d1 = await controller.delete({ status: 0 });
    assert.strictEqual(d1, true);
    assert.deepStrictEqual(deletedFilter, { status: 0 });

    await new Promise<void>((resolve) => {
      controller.Delete({ status: 0 }, (err, res) => {
        assert.strictEqual(err, null);
        assert.strictEqual(res, true);
        resolve();
      });
    });

    const d2 = await controller.deleteById("del_1");
    assert.strictEqual(d2, true);
    assert.strictEqual(deletedId, "del_1");

    await new Promise<void>((resolve) => {
      controller.DeleteById("del_2", (err, res) => {
        assert.strictEqual(err, null);
        assert.strictEqual(res, true);
        resolve();
      });
    });
  });

  it("should support incById and IncById callback", async () => {
    let incDoc: any = null;
    const mockModel = {
      updateById: async (_id: any, doc: any) => {
        incDoc = doc;
        return true;
      },
    };
    const controller = new BaseController(mockModel);

    const res = await controller.incById("item_1", "views", 5);
    assert.strictEqual(res, true);
    assert.deepStrictEqual(incDoc, { $inc: { views: 5 } });

    await new Promise<void>((resolve) => {
      controller.IncById("item_2", "views", 1, (err, ok) => {
        assert.strictEqual(err, null);
        assert.strictEqual(ok, true);
        resolve();
      });
    });
  });

  it("should support aggregate and Aggregate callback", async () => {
    const mockAgg = [{ _id: "total", sum: 100 }];
    const mockModel = {
      aggregate: async () => mockAgg,
    };
    const controller = new BaseController(mockModel);

    const res = await controller.aggregate([{ $match: {} }]);
    assert.deepStrictEqual(res, mockAgg);

    await new Promise<void>((resolve) => {
      controller.Aggregate([{ $match: {} }], (err, rows) => {
        assert.strictEqual(err, null);
        assert.deepStrictEqual(rows, mockAgg);
        resolve();
      });
    });
  });

  it("should support legacy capitalized callbacks when modern methods are absent", async () => {
    const legacyModel = {
      Find: (_q: any, cb: any) => cb(null, [{ _id: "leg_1" }]),
      FindOne: (_q: any, cb: any) => cb(null, { _id: "leg_2" }),
      FindByObjectId: (_q: any, _field: any, cb: any) =>
        cb(null, { _id: "leg_3" }),
      Insert: (_doc: any, cb: any) => cb(null, { _id: "leg_4" }),
      Update: (_q: any, _doc: any, _opts: any, cb: any) => cb(null, true),
      UpdateByObjectId: (_q: any, _doc: any, _field: any, cb: any) =>
        cb(null, true),
      Remove: (_q: any, cb: any) => cb(null, true),
      RemoveByObjectId: (_q: any, _field: any, cb: any) => cb(null, true),
      Aggregate: (_pipe: any, cb: any) => cb(null, [{ count: 42 }]),
    };

    const controller = new BaseController(legacyModel);
    assert.strictEqual((await controller.list()).length, 1);
    assert.strictEqual((await controller.getOne({}))?._id, "leg_2");
    assert.strictEqual((await controller.findById("leg_3"))?._id, "leg_3");
    assert.strictEqual((await controller.create({}))?._id, "leg_4");
    assert.strictEqual(await controller.update({}, {}), true);
    assert.strictEqual(await controller.updateById("leg_3", {}), true);
    assert.strictEqual(await controller.delete({}), true);
    assert.strictEqual(await controller.deleteById("leg_3"), true);
    assert.strictEqual((await controller.aggregate([]))[0].count, 42);
  });

  it("should throw formatted errors when underlying model throws", async () => {
    const failingModel = {
      find: async () => {
        throw new Error("Find failed");
      },
      findOne: async () => {
        throw new Error("FindOne failed");
      },
      findById: async () => {
        throw new Error("FindById failed");
      },
      insert: async () => {
        throw new Error("Insert failed");
      },
      update: async () => {
        throw new Error("Update failed");
      },
      updateById: async () => {
        throw new Error("UpdateById failed");
      },
      delete: async () => {
        throw new Error("Delete failed");
      },
      deleteById: async () => {
        throw new Error("DeleteById failed");
      },
      aggregate: async () => {
        throw new Error("Aggregate failed");
      },
    };

    const controller = new BaseController<{ _id?: string }>(failingModel);
    await assert.rejects(
      async () => controller.list(),
      /BaseController\.list failed/,
    );
    await assert.rejects(
      async () => controller.getOne({}),
      /BaseController\.getOne failed/,
    );
    await assert.rejects(
      async () => controller.findById("1"),
      /BaseController\.findById failed/,
    );
    await assert.rejects(
      async () => controller.create({}),
      /BaseController\.create failed/,
    );
    await assert.rejects(
      async () => controller.update({}, {}),
      /BaseController\.update failed/,
    );
    await assert.rejects(
      async () => controller.updateById("1", {}),
      /BaseController\.updateById failed/,
    );
    await assert.rejects(
      async () => controller.delete({}),
      /BaseController\.delete failed/,
    );
    await assert.rejects(
      async () => controller.deleteById("1"),
      /BaseController\.deleteById failed/,
    );
    await assert.rejects(
      async () => controller.aggregate([]),
      /BaseController\.aggregate failed/,
    );
  });

  it("should support count and Count callback", async () => {
    const mockModel = {
      count: async () => 128,
      estimatedCount: async () => 128,
    };
    const controller = new BaseController(mockModel);
    const count = await controller.count({});
    assert.strictEqual(count, 128);

    await new Promise<void>((resolve) => {
      controller.Count({}, (err, res) => {
        assert.strictEqual(err, null);
        assert.strictEqual(res, 128);
        resolve();
      });
    });
  });

  it("should support paginate and Paginate callback with clamped limits and metadata", async () => {
    const mockItems = Array.from({ length: 25 }, (_, i) => ({
      _id: `id_${i + 1}`,
      name: `Product ${i + 1}`,
    }));
    const mockModel = {
      find: async (_query: any, opts: any) => {
        assert.strictEqual(opts.limit, 25);
        assert.strictEqual(opts.skip, 50);
        return mockItems;
      },
      count: async () => 100,
      estimatedCount: async () => 100,
    };
    const controller = new BaseController(mockModel);
    const result = await controller.paginate({}, { page: 3, limit: 25 });

    assert.strictEqual(result.data.length, 25);
    assert.strictEqual(result.pagination.page, 3);
    assert.strictEqual(result.pagination.limit, 25);
    assert.strictEqual(result.pagination.total, 100);
    assert.strictEqual(result.pagination.totalPages, 4);
    assert.strictEqual(result.pagination.hasNext, true);
    assert.strictEqual(result.pagination.hasPrev, true);

    await new Promise<void>((resolve) => {
      controller.Paginate(
        {},
        (err, res) => {
          assert.strictEqual(err, null);
          assert.strictEqual(res?.data.length, 25);
          assert.strictEqual(res?.pagination.page, 3);
          resolve();
        },
        { page: 3, limit: 25 },
      );
    });
  });

  it("should clamp paginate max limit to 200", async () => {
    let queriedLimit = 0;
    const mockModel = {
      find: async (_query: any, opts: any) => {
        queriedLimit = opts.limit;
        return [];
      },
      count: async () => 0,
      estimatedCount: async () => 0,
    };
    const controller = new BaseController(mockModel);
    await controller.paginate({}, { limit: 1000 });
    assert.strictEqual(queriedLimit, 200);
  });

  it("should support keyset cursor pagination with endCursor", async () => {
    const mockItems = [
      { _id: "607f1f77bcf86cd799439011", name: "Alpha" },
      { _id: "607f1f77bcf86cd799439012", name: "Beta" },
      { _id: "607f1f77bcf86cd799439013", name: "Gamma" },
    ];
    const mockModel = {
      find: async (_query: any, opts: any) => {
        assert.strictEqual(opts.limit, 3);
        return mockItems;
      },
    };
    const controller = new BaseController(mockModel);
    const result = await controller.cursor({}, { limit: 2 });

    assert.strictEqual(result.data.length, 2);
    assert.strictEqual(result.pageInfo.hasNextPage, true);
    assert.ok(result.pageInfo.endCursor);

    await new Promise<void>((resolve) => {
      controller.Cursor(
        {},
        (err, res) => {
          assert.strictEqual(err, null);
          assert.strictEqual(res?.data.length, 2);
          assert.strictEqual(res?.pageInfo.hasNextPage, true);
          resolve();
        },
        { limit: 2 },
      );
    });
  });
});
