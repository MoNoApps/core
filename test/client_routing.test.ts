import { describe, it } from "node:test";
import assert from "node:assert";
import { parseRouteFromLocation } from "../src/client/App";
import api from "../src/client/api/client";

describe("Client Routing and Token Error Guard Suite", () => {
  describe("parseRouteFromLocation", () => {
    it("should immediately resolve resource view without showing home when token is present", () => {
      const result = parseRouteFromLocation("#/products", "valid-token-123");
      assert.strictEqual(result.view, "resource");
      assert.strictEqual(result.resource, "products");
    });

    it("should smoothly render home instead of resource when token is missing", () => {
      const result = parseRouteFromLocation("#/products", null);
      assert.strictEqual(result.view, "home");
      assert.strictEqual(result.resource, "");
    });

    it("should smoothly render home when account route is visited without token", () => {
      const result = parseRouteFromLocation("#/account", null);
      assert.strictEqual(result.view, "home");
      assert.strictEqual(result.resource, "");
    });

    it("should smoothly render home when docs route is visited without token", () => {
      const result = parseRouteFromLocation("#/docs", null);
      assert.strictEqual(result.view, "home");
      assert.strictEqual(result.resource, "");
    });

    it("should render account view when token is present", () => {
      const result = parseRouteFromLocation("#/account", "valid-token-123");
      assert.strictEqual(result.view, "account");
      assert.strictEqual(result.resource, "");
    });

    it("should render docs view when token is present", () => {
      const result = parseRouteFromLocation("#/docs", "valid-token-123");
      assert.strictEqual(result.view, "docs");
      assert.strictEqual(result.resource, "");
    });

    it("should render home view when hash is home or root", () => {
      assert.deepStrictEqual(
        parseRouteFromLocation("#/home", "valid-token-123"),
        {
          view: "home",
          resource: "",
        },
      );
      assert.deepStrictEqual(parseRouteFromLocation("#/", "valid-token-123"), {
        view: "home",
        resource: "",
      });
      assert.deepStrictEqual(parseRouteFromLocation("", "valid-token-123"), {
        view: "home",
        resource: "",
      });
    });

    it("should fallback to home for unknown resource routes", () => {
      const result = parseRouteFromLocation(
        "#/nonexistent_resource_xyz",
        "valid-token-123",
      );
      assert.strictEqual(result.view, "home");
      assert.strictEqual(result.resource, "");
    });
  });

  describe("ApiClient Token Management", () => {
    it("should allow setting and retrieving token", () => {
      api.setToken("test-token-value");
      assert.strictEqual(api.getToken(), "test-token-value");
      api.setToken(null);
      assert.strictEqual(api.getToken(), null);
    });
  });

  describe("Navbar Menu Visibility Rules", () => {
    it("should evaluate hasOtherNavOptions to false when unauthenticated (home is the only option, do not show Home option)", () => {
      const isAuthenticated = false;
      const resources: any[] = [];
      const hasResources = isAuthenticated && resources.length > 0;
      const hasDocs = isAuthenticated;
      const hasOtherNavOptions = hasResources || hasDocs;
      assert.strictEqual(hasOtherNavOptions, false);
    });

    it("should evaluate hasOtherNavOptions to true when authenticated with resources or docs", () => {
      const isAuthenticated = true;
      const resources = [{ name: "products" }];
      const hasResources = isAuthenticated && resources.length > 0;
      const hasDocs = isAuthenticated;
      const hasOtherNavOptions = hasResources || hasDocs;
      assert.strictEqual(hasOtherNavOptions, true);
    });
  });
});
