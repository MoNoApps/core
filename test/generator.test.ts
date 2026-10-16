import { describe, it } from "node:test";
import assert from "node:assert";
import * as generator from "../helpers/generator";

describe("Dynamic Route Generator Suite (helpers/generator.ts)", () => {
  it("addRoutes should register all REST routes with api.del and execute callbacks", () => {
    const handlers: Record<string, Function> = {};
    const mockApi = {
      get: (route: string, fn: Function) => {
        handlers[`GET ${route}`] = fn;
      },
      post: (route: string, fn: Function) => {
        handlers[`POST ${route}`] = fn;
      },
      put: (route: string, fn: Function) => {
        handlers[`PUT ${route}`] = fn;
      },
      del: (route: string, fn: Function) => {
        handlers[`DEL ${route}`] = fn;
      },
    };

    const mockController = {
      list: async () => [],
      findById: async () => null,
      deleteById: async () => true,
      create: async () => ({}),
      updateById: async () => true,
    };

    generator.addRoutes({
      api: mockApi,
      route: "items",
      controller: mockController,
    });

    assert.ok(handlers["GET /items"]);
    assert.ok(handlers["GET /items/:id"]);
    assert.ok(handlers["POST /items"]);
    assert.ok(handlers["PUT /items/:id"]);
    assert.ok(handlers["DEL /items/:id"]);

    const mockRes = {
      status: () => ({ json: () => {}, send: () => {} }),
    };

    // Invoke callbacks to verify execution
    handlers["GET /items"]({ params: {}, headers: {} }, mockRes);
    handlers["GET /items/:id"]({ params: { id: "1" }, headers: {} }, mockRes);
    handlers["POST /items"]({ params: {}, headers: {} }, mockRes);
    handlers["PUT /items/:id"]({ params: { id: "1" }, headers: {} }, mockRes);
    handlers["DEL /items/:id"]({ params: { id: "1" }, headers: {} }, mockRes);
  });

  it("addRoutes should support api.delete when api.del is not defined", () => {
    const handlers: Record<string, Function> = {};
    const mockApi = {
      get: () => {},
      post: () => {},
      put: () => {},
      delete: (route: string, fn: Function) => {
        handlers[`DELETE ${route}`] = fn;
      },
    };

    generator.addRoutes({
      api: mockApi,
      route: "products",
      controller: {},
    });

    assert.ok(handlers["DELETE /products/:id"]);
    const mockRes = {
      status: () => ({ json: () => {}, send: () => {} }),
    };
    handlers["DELETE /products/:id"](
      { params: { id: "p1" }, headers: {} },
      mockRes,
    );
  });
});
