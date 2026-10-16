import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { ObjectId } from "mongodb";
import { setDb, closeDb, ModernModel, getCollection } from "../helpers/db";
import { seedDatabase, main as seedMain } from "../migrations/seed";

describe("Database & Migrations Unit Test Suite (helpers/db, seed)", () => {
  const store: Record<string, any[]> = {};

  const createMockCollection = (name: string) => {
    store[name] = store[name] || [];
    return {
      name,
      collectionName: name,
      find: (filter: any = {}) => {
        let items = [...store[name]];
        if (filter && Object.keys(filter).length > 0) {
          items = items.filter((doc) =>
            Object.entries(filter).every(
              ([k, v]) => String(doc[k]) === String(v),
            ),
          );
        }
        const cursor = {
          items,
          sort: function (_sortObj: any) {
            return this;
          },
          skip: function (num: number) {
            this.items = this.items.slice(num);
            return this;
          },
          limit: function (num: number) {
            this.items = this.items.slice(0, num);
            return this;
          },
          toArray: async function () {
            return this.items;
          },
        };
        return cursor;
      },
      findOne: async (filter: any) => {
        return (
          store[name].find((doc) =>
            Object.entries(filter).every(
              ([k, v]) => String(doc[k]) === String(v),
            ),
          ) || null
        );
      },
      insertOne: async (doc: any) => {
        const _id = doc._id || new ObjectId();
        const saved = { ...doc, _id };
        store[name].push(saved);
        return { insertedId: _id };
      },
      insertMany: async (docs: any[]) => {
        for (const doc of docs) {
          const _id = doc._id || new ObjectId();
          store[name].push({ ...doc, _id });
        }
        return { acknowledged: true, insertedCount: docs.length };
      },
      updateOne: async (filter: any, updateDoc: any) => {
        const doc = store[name].find((d) =>
          Object.entries(filter).every(([k, v]) => String(d[k]) === String(v)),
        );
        if (doc) {
          const patch = updateDoc.$set || updateDoc;
          Object.assign(doc, patch);
          if (updateDoc.$unset) {
            for (const key of Object.keys(updateDoc.$unset)) {
              delete doc[key];
            }
          }
        }
        return { acknowledged: true, modifiedCount: doc ? 1 : 0 };
      },
      updateMany: async (filter: any, updateDoc: any) => {
        let count = 0;
        for (const doc of store[name]) {
          const match = Object.entries(filter).every(
            ([k, v]) => String(doc[k]) === String(v),
          );
          if (match) {
            const patch = updateDoc.$set || updateDoc;
            Object.assign(doc, patch);
            count++;
          }
        }
        return { acknowledged: true, modifiedCount: count };
      },
      deleteOne: async (filter: any) => {
        const idx = store[name].findIndex((d) =>
          Object.entries(filter).every(([k, v]) => String(d[k]) === String(v)),
        );
        if (idx !== -1) {
          store[name].splice(idx, 1);
        }
        return { acknowledged: true, deletedCount: idx !== -1 ? 1 : 0 };
      },
      deleteMany: async (filter: any) => {
        const initialLen = store[name].length;
        store[name] = store[name].filter(
          (d) =>
            !Object.entries(filter).every(
              ([k, v]) => String(d[k]) === String(v),
            ),
        );
        return {
          acknowledged: true,
          deletedCount: initialLen - store[name].length,
        };
      },
      drop: async () => {
        store[name] = [];
        return true;
      },
      createIndex: async () => "idx_ok",
    };
  };

  const mockDb: any = {
    collection: (name: string) => createMockCollection(name),
  };

  before(() => {
    setDb(mockDb);
  });

  after(async () => {
    await closeDb();
  });

  describe("helpers/db.ts ModernModel Operations", () => {
    it("should handle CRUD lifecycle, cursor options, and string IDs", async () => {
      const model = new ModernModel<any>("test_unit_items");

      // 1. insert
      const item = await model.insert({ name: "Unit Item", score: 10 });
      assert.ok(item._id);
      assert.strictEqual(item.name, "Unit Item");

      // 2. find with sort, skip, limit
      const list = await model.find(
        {},
        { sort: { score: 1 }, skip: 0, limit: 10 },
      );
      assert.strictEqual(list.length, 1);

      // 3. findOne
      const one = await model.findOne({ score: 10 });
      assert.ok(one);
      assert.strictEqual(one.name, "Unit Item");

      // 4. findById with valid ObjectId string
      const byValidId = await model.findById(item._id.toString());
      assert.ok(byValidId);

      // 5. findById with non-ObjectId string
      const nonObjId = "non-valid-id-123";
      const byInvalidId = await model.findById(nonObjId);
      assert.strictEqual(byInvalidId, null);

      // 6. update with filter
      const updatedMany = await model.update(
        { score: 10 },
        { $set: { score: 20 } },
      );
      assert.strictEqual(updatedMany, true);

      // 7. updateById with $set
      const updatedById = await model.updateById(item._id, {
        $set: { score: 30 },
      });
      assert.strictEqual(updatedById, true);

      // 8. updateById with raw document and non-valid string id
      await model.updateById(nonObjId, { score: 99 });

      // 9. delete with filter
      const deletedMany = await model.delete({ score: 999 });
      assert.strictEqual(deletedMany, true);

      // 10. deleteById with non-valid string id and valid id
      await model.deleteById(nonObjId);
      const deletedById = await model.deleteById(item._id);
      assert.strictEqual(deletedById, true);

      // 11. getCollection helper
      const col = await getCollection("test_unit_items");
      assert.strictEqual(col.collectionName, "test_unit_items");
    });
  });

  describe("migrations/seed.ts Seeding", () => {
    it("should seed database successfully", async () => {
      await seedDatabase();
      const col = await getCollection("settings");
      const items = await col.find({}).toArray();
      assert.ok(items.length > 0);
    });

    it("should handle drop error and createIndex error gracefully", async () => {
      const origCollection = mockDb.collection;
      try {
        mockDb.collection = (name: string) => {
          const col = createMockCollection(name);
          if (name === "settings") {
            col.drop = async () => {
              throw new Error("Collection does not exist");
            };
          }
          if (name === "tokens") {
            col.createIndex = async () => {
              throw new Error("Index already exists");
            };
          }
          return col;
        };

        await seedDatabase();
      } finally {
        mockDb.collection = origCollection;
      }
    });

    it("seed main() should run successfully and handle errors", async (t) => {
      t.mock.method(console, "error", () => {});
      await seedMain();

      const origCollection = mockDb.collection;
      try {
        mockDb.collection = () => {
          throw new Error("DB fatal");
        };
        await assert.rejects(async () => {
          await seedMain();
        });
      } finally {
        mockDb.collection = origCollection;
      }
    });
  });
});
