import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { svr } from "../web/routes";
import { closeRedis } from "../helpers/ps";

describe("Web Server Integration Test Suite (SPA & Middleware)", () => {
  let server: any;
  const TEST_PORT = 19453;
  const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

  before(async () => {
    await new Promise((resolve) => {
      server = svr.listen(TEST_PORT, () => resolve(true));
    });
  });

  after(async () => {
    if (server && typeof server.close === "function") {
      server.closeAllConnections?.();
      await new Promise((resolve) => server.close(resolve));
    }
    try {
      await closeRedis();
    } catch {}
  });

  it("GET /robots.txt should serve robots directive with text/plain", async () => {
    const res = await fetch(`${BASE_URL}/robots.txt`);
    assert.strictEqual(res.status, 200);
    const text = await res.text();
    assert.match(text, /User-agent: \*/);
  });

  it("GET / should serve the home page HTML", async () => {
    const res = await fetch(`${BASE_URL}/`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.match(html, /html/i);
  });

  it("GET /account should serve SPA index.html for client-side routing", async () => {
    const res = await fetch(`${BASE_URL}/account`, {
      headers: { Accept: "text/html" },
    });
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.match(html, /html/i);
  });

  it("GET /docs should serve SPA index.html for client-side routing", async () => {
    const res = await fetch(`${BASE_URL}/docs`, {
      headers: { Accept: "text/html" },
    });
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.match(html, /html/i);
  });

  it("GET /dev should serve SPA index.html for client-side routing", async () => {
    const res = await fetch(`${BASE_URL}/dev`, {
      headers: { Accept: "text/html" },
    });
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.match(html, /html/i);
  });

  it("POST /nonexistent should bypass SPA fallback and return 404", async () => {
    const res = await fetch(`${BASE_URL}/nonexistent`, {
      method: "POST",
    });
    assert.strictEqual(res.status, 404);
  });

  it("POST /api/login should be handled by mounted API without returning HTML 404", async () => {
    const res = await fetch(`${BASE_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.strictEqual(res.status, 401);
    const data = (await res.json()) as any;
    assert.strictEqual(data.error, "Email and password are required");
  });

  it("GET /api/ping should return API status 200 via web server", async () => {
    const res = await fetch(`${BASE_URL}/api/ping`);
    assert.strictEqual(res.status, 200);
    const text = await res.text();
    assert.strictEqual(text, "OK");
  });

  it("GET /nonexistent with non-html accept header should bypass SPA fallback", async () => {
    const res = await fetch(`${BASE_URL}/nonexistent`, {
      headers: { Accept: "application/json" },
    });
    assert.strictEqual(res.status, 404);
  });

  it("GET /spa-fallback-route should serve SPA index.html for unknown HTML route", async () => {
    const res = await fetch(`${BASE_URL}/spa-fallback-route`, {
      headers: { Accept: "text/html" },
    });
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.match(html, /html/i);
  });
});
