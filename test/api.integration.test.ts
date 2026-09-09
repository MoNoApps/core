import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { api } from "../api/routes";
import { models } from "../helpers/models";

describe("API Integration Test Suite (Node 24 Native Fetch)", () => {
  let server: any;
  const TEST_PORT = 19452;
  const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

  before(async () => {
    // Mock user model operations for isolated integration testing
    models.users.findOne = async () => null;
    models.users.insert = async (doc: any) => ({ ...doc, _id: "mock_user_id" });

    await new Promise((resolve) => {
      server = api.listen(TEST_PORT, () => resolve(true));
    });
  });

  after(async () => {
    if (server && typeof server.close === "function") {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it("GET /ping should respond with 200 OK", async () => {
    const res = await fetch(`${BASE_URL}/ping`);
    assert.strictEqual(res.status, 200);
    const text = await res.text();
    assert.strictEqual(text, "OK");
  });

  it("GET /theme should return application theme configuration", async () => {
    const res = await fetch(`${BASE_URL}/theme`);
    assert.strictEqual(res.status, 200);
    const data = (await res.json()) as any;
    assert.ok(data.theme);
  });

  it("POST /login without payload should return 401 Unauthorized", async () => {
    const res = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.strictEqual(res.status, 401);
  });

  it("POST /register/:email should initiate user registration", async () => {
    const email = "integration_test@monoapps.co";
    const res = await fetch(`${BASE_URL}/register/${email}`, {
      method: "POST",
    });
    assert.strictEqual(res.status, 200);
    const text = await res.text();
    assert.strictEqual(text, "Email Registered.");
  });
});
