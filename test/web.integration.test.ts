import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { svr } from "../web/routes";

describe("Web Server Integration Test Suite (SSR & Middleware)", () => {
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
      await new Promise((resolve) => server.close(resolve));
    }
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
});
