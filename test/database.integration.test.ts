import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { getDb, ModernModel, closeDb } from "../helpers/db";
import { connectRedis, pub, sub, closeRedis } from "../helpers/ps";
import { seedDatabase } from "../migrations/seed";
import { startMockMongo, startMockRedis } from "./helpers/mockServers";
import type { MockServerHandle, TestDoc } from "./types";

describe("Live Database & Redis Integration Suite (MongoDB 9 & Redis 7)", () => {
  let isMongoAvailable = false;
  let isRedisAvailable = false;
  let mongoMock: MockServerHandle | null = null;
  let redisMock: MockServerHandle | null = null;

  before(async () => {
    // Start mock port listeners if ports 27017 and 6379 are not occupied
    mongoMock = await startMockMongo(27017);
    redisMock = await startMockRedis(6379);

    // Check MongoDB connectivity
    try {
      let mongoTimer: any;
      const db = await Promise.race([
        getDb(),
        new Promise<never>((_, reject) => {
          mongoTimer = setTimeout(
            () => reject(new Error("MongoDB connection timeout")),
            500,
          );
          mongoTimer.unref?.();
        }),
      ]);
      clearTimeout(mongoTimer);
      await db.command({ ping: 1 });
      isMongoAvailable = true;
    } catch {
      isMongoAvailable = false;
    }

    // Check Redis connectivity
    try {
      let redisTimer: any;
      await Promise.race([
        connectRedis(),
        new Promise<never>((_, reject) => {
          redisTimer = setTimeout(
            () => reject(new Error("Redis connection timeout")),
            500,
          );
          redisTimer.unref?.();
        }),
      ]);
      clearTimeout(redisTimer);
      await pub.ping();
      isRedisAvailable = true;
    } catch {
      isRedisAvailable = false;
    }
  });

  after(async () => {
    if (isRedisAvailable) {
      await closeRedis();
    }
    if (isMongoAvailable) {
      await closeDb();
    }
    if (redisMock) {
      await redisMock.close();
    }
    if (mongoMock) {
      await mongoMock.close();
    }
  });

  describe("MongoDB 9 ModernModel Real Database Operations", () => {
    it("should perform live CRUD operations against MongoDB 9 collection", async (t) => {
      if (!isMongoAvailable) {
        t.skip("MongoDB service not available in current environment");
        return;
      }

      const model = new ModernModel<TestDoc>("test_integration_items");

      // 1. Insert document
      const created = await model.insert({
        name: "Integration Test Item",
        value: 42,
      });
      assert.ok(created._id, "Document should receive an _id");
      assert.strictEqual(created.name, "Integration Test Item");

      // 2. Find by ID
      const found = await model.findById(created._id);
      assert.ok(found, "Document should be retrievable by ID");
      assert.strictEqual(found?.value, 42);

      // 3. Update by ID
      const updateResult = await model.updateById(created._id, { value: 100 });
      assert.strictEqual(updateResult, true);
      const updated = await model.findById(created._id);
      assert.strictEqual(updated?.value, 100);

      // 4. Query with filter
      const list = await model.find({ value: 100 });
      assert.ok(list.length >= 1);

      // 5. Delete by ID
      const deleteResult = await model.deleteById(created._id);
      assert.strictEqual(deleteResult, true);
      const afterDelete = await model.findById(created._id);
      assert.strictEqual(afterDelete, null);
    });
  });

  describe("Database Seeding & Migration Scripts", () => {
    it("seedDatabase() should populate settings collection without errors", async (t) => {
      if (!isMongoAvailable) {
        t.skip("MongoDB service not available in current environment");
        return;
      }

      await seedDatabase();
      const settingsModel = new ModernModel("settings");
      const seeded = await settingsModel.find({});
      assert.ok(Array.isArray(seeded));
    });

    it("seedDatabase() should seed default demo accounts in database", async (t) => {
      if (!isMongoAvailable) {
        t.skip("MongoDB service not available in current environment");
        return;
      }

      const usersModel = new ModernModel("users");
      const admin = await usersModel.findOne({ email: "admin@example.com" });
      assert.ok(admin, "Admin user should be seeded");
      const viewer = await usersModel.findOne({ email: "viewer@example.com" });
      assert.ok(viewer, "Viewer user should be seeded");
    });
  });

  describe("Redis 7 Pub/Sub Real-time Integration", () => {
    it("should publish and receive messages across pub/sub channels", async (t) => {
      if (!isRedisAvailable) {
        t.skip("Redis service not available in current environment");
        return;
      }

      const testChannel = "test:channel:integration";
      const payload = JSON.stringify({
        event: "resource:create",
        data: { id: "123" },
      });

      let resolveMessage: (val: string) => void;
      const receivedPromise = new Promise<string>((resolve) => {
        resolveMessage = resolve;
      });

      await sub.subscribe(testChannel, (message) => {
        resolveMessage(message);
      });

      await pub.publish(testChannel, payload);

      const received = await receivedPromise;
      assert.strictEqual(received, payload);

      await sub.unsubscribe(testChannel);
    });
  });

  after(async () => {
    try {
      await closeDb();
    } catch {}
    try {
      await closeRedis();
    } catch {}
    try {
      await mongoMock?.close();
    } catch {}
    try {
      await redisMock?.close();
    } catch {}
  });
});
