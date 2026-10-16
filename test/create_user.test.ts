import { describe, it, before } from "node:test";
import assert from "node:assert";
import {
  createOrUpdateUser,
  createOrPromoteAdmin,
  createOrUpdateViewer,
  parseArgs,
  printUsageExamples,
} from "../scripts/create_user";
import { getCollection, getDb, closeDb } from "../helpers/db";
import * as utils from "../helpers/utils";
import type { User } from "../src/types/index";

describe("Unified User Provisioning Suite (scripts/create_user.ts)", () => {
  let isMongoAvailable = false;

  before(async () => {
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
  });

  describe("Validation & Argument Parsing", () => {
    it("should reject invalid email format", async () => {
      await assert.rejects(
        async () => {
          await createOrUpdateUser({
            email: "invalid-email",
            password: "Secret123!",
          });
        },
        { message: /Valid email address is required/ },
      );
    });

    it("parseArgs should correctly parse positional and flag arguments", () => {
      const parsedFlags = parseArgs([
        "alice@example.com",
        "Secret123!",
        "Alice Admin",
        "--role",
        "admin",
      ]);
      assert.strictEqual(parsedFlags.email, "alice@example.com");
      assert.strictEqual(parsedFlags.password, "Secret123!");
      assert.strictEqual(parsedFlags.name, "Alice Admin");
      assert.strictEqual(parsedFlags.role, "admin");
      assert.strictEqual(parsedFlags.isHelp, false);

      const parsedViewer = parseArgs([
        "bob@example.com",
        "ViewerPass1!",
        "--viewer",
      ]);
      assert.strictEqual(parsedViewer.email, "bob@example.com");
      assert.strictEqual(parsedViewer.password, "ViewerPass1!");
      assert.strictEqual(parsedViewer.role, "viewer");

      const parsedHelp = parseArgs(["--help"]);
      assert.strictEqual(parsedHelp.isHelp, true);
    });

    it("printUsageExamples should print comprehensive guidance without throwing", () => {
      let logged = "";
      const origLog = console.log;
      console.log = (msg: string) => {
        logged += msg;
      };
      try {
        printUsageExamples("Missing required argument(s): <email>");
        assert.ok(logged.includes("Core Platform - User Provisioning CLI"));
        assert.ok(logged.includes("Missing required argument(s): <email>"));
        assert.ok(logged.includes("create:admin"));
        assert.ok(logged.includes("create:viewer"));
        assert.ok(logged.includes("create:user"));
      } finally {
        console.log = origLog;
      }
    });
  });

  describe("Database Operations (when MongoDB is running)", () => {
    it("should reject missing password when creating a new user", async (t) => {
      if (!isMongoAvailable) {
        t.skip("MongoDB service not available in current environment");
        return;
      }

      await assert.rejects(
        async () => {
          await createOrUpdateUser({
            email: `nonexistent-${Date.now()}@example.com`,
          });
        },
        { message: /Password is required when creating a new/ },
      );
    });

    it("should create a new admin user with correct role and admin flag", async (t) => {
      if (!isMongoAvailable) {
        t.skip("MongoDB service not available in current environment");
        return;
      }

      const testEmail = `admin-test-${Date.now()}@example.com`;
      const testPassword = "AdminSecretPassword123!";

      const admin = await createOrPromoteAdmin(
        testEmail,
        testPassword,
        "SuperAdmin",
      );
      assert.ok(admin._id);
      assert.strictEqual(admin.email, testEmail);
      assert.strictEqual(admin.admin, true);
      assert.strictEqual(admin.role, "admin");
      assert.strictEqual(admin.status, 1);

      // Verify password hash validates with utils.comparePwd
      const userId = (admin._id as any).toString();
      const isOk = utils.comparePwd(
        {
          key: userId,
          text: testPassword,
        },
        admin.password as any,
      );
      assert.strictEqual(isOk, true);

      // Clean up
      const col = await getCollection<User>("users");
      await col.deleteOne({ _id: admin._id });
      await closeDb();
    });

    it("should create a new viewer user with role 'viewer' and admin: false", async (t) => {
      if (!isMongoAvailable) {
        t.skip("MongoDB service not available in current environment");
        return;
      }

      const testEmail = `viewer-test-${Date.now()}@example.com`;
      const testPassword = "ViewerPassword123!";

      const viewer = await createOrUpdateViewer(
        testEmail,
        testPassword,
        "SecurityAuditor",
      );
      assert.ok(viewer._id);
      assert.strictEqual(viewer.email, testEmail);
      assert.strictEqual(viewer.admin, false);
      assert.strictEqual(viewer.role, "viewer");
      assert.strictEqual(viewer.status, 1);

      // Clean up
      const col = await getCollection<User>("users");
      await col.deleteOne({ _id: viewer._id });
      await closeDb();
    });

    it("should promote existing user to admin", async (t) => {
      if (!isMongoAvailable) {
        t.skip("MongoDB service not available in current environment");
        return;
      }

      const testEmail = `user-promote-${Date.now()}@example.com`;
      const col = await getCollection<User>("users");

      // Create standard user
      const inserted = await col.insertOne({
        email: testEmail,
        role: "user",
        admin: false,
        status: 1,
      } as any);

      // Promote to admin
      const updated = await createOrPromoteAdmin(
        testEmail,
        "NewPassword123!",
        "PromotedAdmin",
      );
      assert.strictEqual(updated.admin, true);
      assert.strictEqual(updated.role, "admin");

      // Clean up
      await col.deleteOne({ _id: inserted.insertedId });
      await closeDb();
    });
  });
});
