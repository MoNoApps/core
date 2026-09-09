import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { MongoClient } from "mongodb";
import { getDb, ModernModel } from "../helpers/db";
import { connectRedis, pub, sub } from "../helpers/ps";
import { seedDatabase } from "../migrations/seed";
import { createGuestUser } from "../migrations/guest";

describe("Live Database & Redis Integration Suite (MongoDB 8 & Redis 7)", () => {
  let isMongoAvailable = false;
  let isRedisAvailable = false;

  before(async () => {
    // Check MongoDB connectivity with quick fallback
    try {
      const db = await Promise.race([
        getDb(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("MongoDB connection timeout")),
            600,
          ),
        ),
      ]);
      await db.command({ ping: 1 });
      isMongoAvailable = true;
    } catch {
      isMongoAvailable = false;
    }

    // Check Redis connectivity with quick fallback
    try {
      await Promise.race([
        connectRedis(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Redis connection timeout")), 600),
        ),
      ]);
      await pub.ping();
      isRedisAvailable = true;
    } catch {
      isRedisAvailable = false;
    }
  });

  after(async () => {
    if (isRedisAvailable) {
      try {
        if (pub.isOpen) await pub.quit();
        if (sub.isOpen) await sub.quit();
      } catch {
        // Ignore disconnect errors
      }
    }
  });

  describe("MongoDB 8 ModernModel Real Database Operations", () => {
    it("should perform live CRUD operations against MongoDB 8 collection", async (t) => {
      if (!isMongoAvailable) {
        t.skip("MongoDB service not available in current environment");
        return;
      }

      interface TestDoc {
        _id?: any;
        name: string;
        value: number;
        createdAt?: Date;
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

    it("createGuestUser() should create or update guest account in database", async (t) => {
      if (!isMongoAvailable) {
        t.skip("MongoDB service not available in current environment");
        return;
      }

      const guest = await createGuestUser();
      assert.ok(guest, "Guest user should be created");
      assert.strictEqual(typeof guest?.email, "string");
      assert.ok(guest?.email.includes("@"));
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

      const receivedPromise = new Promise<string>((resolve) => {
        sub.subscribe(testChannel, (message) => {
          resolve(message);
        });
      });

      // Small delay to ensure subscription is active
      await new Promise((resolve) => setTimeout(resolve, 50));
      await pub.publish(testChannel, payload);

      const received = await receivedPromise;
      assert.strictEqual(received, payload);

      await sub.unsubscribe(testChannel);
    });
  });
});
