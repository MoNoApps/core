import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { api } from "../api/routes";
import { models } from "../helpers/models";
import { controllers } from "../api/controllers";
import { closeRedis } from "../helpers/ps";

describe("Viewer Role & Read-Only Access Control Suite", () => {
  let server: any;
  const TEST_PORT = 19459;
  const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

  const viewerUserId = "607f1f77bcf86cd799439001";
  const viewerTokenId = "607f1f77bcf86cd799439002";

  const adminUserId = "607f1f77bcf86cd799439003";
  const adminTokenId = "607f1f77bcf86cd799439004";

  const viewerUser = {
    _id: viewerUserId,
    email: "viewer_audit@example.com",
    name: "Auditor Viewer",
    role: "viewer",
    admin: false,
    status: 1,
  };

  const adminUser = {
    _id: adminUserId,
    email: "admin_super@example.com",
    name: "System Admin",
    role: "admin",
    admin: true,
    status: 1,
  };

  const sampleProduct = {
    _id: "607f1f77bcf86cd799439099",
    name: "Enterprise Noise-Cancelling Headphones",
    sku: "AUD-HD-99",
    price: 299.99,
  };

  before(async () => {
    // Mock user model lookups
    models.users.findById = async (id: any) => {
      const idStr = id?.toString();
      if (idStr === viewerUserId) return viewerUser as any;
      if (idStr === adminUserId) return adminUser as any;
      return null;
    };

    models.users.findOne = async (query: any) => {
      if (query.email === viewerUser.email) return viewerUser as any;
      if (query.email === adminUser.email) return adminUser as any;
      return null;
    };

    // Mock token lookups
    models.tokens.findById = async (tokenId: any) => {
      const idStr = tokenId?.toString();
      if (idStr === viewerTokenId) {
        return {
          _id: viewerTokenId,
          token: viewerTokenId,
          user: viewerUserId,
          createdAt: new Date(),
          expires: 84000,
        } as any;
      }
      if (idStr === adminTokenId) {
        return {
          _id: adminTokenId,
          token: adminTokenId,
          user: adminUserId,
          createdAt: new Date(),
          expires: 84000,
        } as any;
      }
      return null;
    };

    // Mock product controller operations
    if (controllers.products) {
      controllers.products.list = async () => [sampleProduct] as any;
      controllers.products.count = async () => 1;
      controllers.products.findById = async (id: any) => {
        if (id?.toString() === sampleProduct._id) return sampleProduct as any;
        return null;
      };
      controllers.products.create = async (doc: any) => ({
        ...doc,
        _id: "new_prod_id",
      });
      controllers.products.updateById = async (_id: any, update: any) => ({
        ...sampleProduct,
        ...update.$set,
      });
      controllers.products.deleteById = async () => true;
    }

    await new Promise((resolve) => {
      server = api.listen(TEST_PORT, () => resolve(true));
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

  describe("Viewer Read Operations (Permitted)", () => {
    it("GET /api/products should allow viewer to list resources", async () => {
      const res = await fetch(`${BASE_URL}/api/products`, {
        headers: { token: viewerTokenId },
      });
      assert.strictEqual(res.status, 200);
      const data = (await res.json()) as any[];
      assert.ok(Array.isArray(data));
      assert.strictEqual(data.length, 1);
      assert.strictEqual(data[0].sku, "AUD-HD-99");
    });

    it("GET /api/products/count should allow viewer to count resources", async () => {
      const res = await fetch(`${BASE_URL}/api/products/count`, {
        headers: { token: viewerTokenId },
      });
      assert.strictEqual(res.status, 200);
      const data = (await res.json()) as any;
      assert.strictEqual(data.count, 1);
    });

    it("GET /api/products/:id should allow viewer to inspect single resource", async () => {
      const res = await fetch(`${BASE_URL}/api/products/${sampleProduct._id}`, {
        headers: { token: viewerTokenId },
      });
      assert.strictEqual(res.status, 200);
      const data = (await res.json()) as any;
      assert.strictEqual(data._id, sampleProduct._id);
      assert.strictEqual(data.name, sampleProduct.name);
    });
  });

  describe("Viewer Mutation Operations (Rejected with 403 Forbidden)", () => {
    it("POST /api/products should reject creation with 403 Forbidden", async () => {
      const res = await fetch(`${BASE_URL}/api/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          token: viewerTokenId,
        },
        body: JSON.stringify({
          name: "Illegal Created Product",
          sku: "ILL-001",
          price: 50.0,
        }),
      });
      assert.strictEqual(res.status, 403);
      const body = (await res.json()) as any;
      assert.strictEqual(body.success, false);
      assert.strictEqual(
        body.error,
        "Forbidden: Viewer accounts have read-only access.",
      );
    });

    it("PUT /api/products/:id should reject update with 403 Forbidden", async () => {
      const res = await fetch(`${BASE_URL}/api/products/${sampleProduct._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          token: viewerTokenId,
        },
        body: JSON.stringify({
          name: "Hacked Product Name",
          price: 1.0,
        }),
      });
      assert.strictEqual(res.status, 403);
      const body = (await res.json()) as any;
      assert.strictEqual(body.success, false);
      assert.strictEqual(
        body.error,
        "Forbidden: Viewer accounts have read-only access.",
      );
    });

    it("DELETE /api/products/:id should reject deletion with 403 Forbidden", async () => {
      const res = await fetch(`${BASE_URL}/api/products/${sampleProduct._id}`, {
        method: "DELETE",
        headers: { token: viewerTokenId },
      });
      assert.strictEqual(res.status, 403);
      const body = (await res.json()) as any;
      assert.strictEqual(body.success, false);
      assert.strictEqual(
        body.error,
        "Forbidden: Viewer accounts have read-only access.",
      );
    });
  });

  describe("Admin Privilege Isolation", () => {
    it("GET /api/users with viewer token should reject with 401 Admin access required", async () => {
      const res = await fetch(`${BASE_URL}/api/users`, {
        headers: { token: viewerTokenId },
      });
      assert.strictEqual(res.status, 401);
      const body = (await res.json()) as any;
      assert.strictEqual(body.error, "Admin access required");
    });

    it("POST /api/products with admin token should allow creation", async () => {
      const res = await fetch(`${BASE_URL}/api/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          token: adminTokenId,
        },
        body: JSON.stringify({
          name: "Admin Approved Product",
          sku: "ADM-999",
          price: 199.99,
        }),
      });
      assert.strictEqual(res.status, 200);
      const body = (await res.json()) as any;
      assert.strictEqual(body.sku, "ADM-999");
    });

    it("PUT /api/products/:id with admin token should allow update", async () => {
      const res = await fetch(`${BASE_URL}/api/products/${sampleProduct._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          token: adminTokenId,
        },
        body: JSON.stringify({
          price: 249.99,
        }),
      });
      assert.strictEqual(res.status, 200);
    });

    it("DELETE /api/products/:id with admin token should allow deletion", async () => {
      const res = await fetch(`${BASE_URL}/api/products/${sampleProduct._id}`, {
        method: "DELETE",
        headers: { token: adminTokenId },
      });
      assert.strictEqual(res.status, 200);
    });
  });
});
