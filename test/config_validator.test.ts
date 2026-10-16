import { describe, it } from "node:test";
import assert from "node:assert";
import {
  validateConfig,
  type AppConfigStructure,
} from "../helpers/configValidator";

describe("Configuration & Schema Validator Suite (helpers/configValidator.ts)", () => {
  it("should validate live config.json without fatal errors", () => {
    const report = validateConfig();
    assert.strictEqual(report.valid, true);
    assert.strictEqual(report.errorsCount, 0);
    assert.ok(report.summary.resourcesCount >= 5);
  });

  describe("Semantic Type Checks", () => {
    it("should flag numeric field configured with type: 'text' (SEMANTIC_TYPE_MISMATCH)", () => {
      const mockConfig: AppConfigStructure = {
        site: "TestCore",
        resources: {
          products: {
            param: "product",
            schema: {
              taxes: {
                tag: "input",
                type: "text",
                name: "taxes",
                min: 0,
              },
            },
          },
        },
      };

      const report = validateConfig({ rawConfig: mockConfig });
      const taxIssue = report.issues.find(
        (i) => i.code === "SEMANTIC_TYPE_MISMATCH" && i.field === "taxes",
      );
      assert.ok(taxIssue);
      assert.strictEqual(taxIssue?.severity, "warning");
      assert.strictEqual(taxIssue?.fixable, true);
    });

    it("should not flag numeric field configured with type: 'number'", () => {
      const mockConfig: AppConfigStructure = {
        site: "TestCore",
        resources: {
          products: {
            param: "product",
            schema: {
              taxes: {
                tag: "input",
                type: "number",
                name: "taxes",
                min: 0,
                step: 0.01,
              },
            },
          },
        },
      };

      const report = validateConfig({ rawConfig: mockConfig });
      const taxIssue = report.issues.find(
        (i) => i.code === "SEMANTIC_TYPE_MISMATCH" && i.field === "taxes",
      );
      assert.strictEqual(taxIssue, undefined);
    });

    it("should flag inverted min/max bounds as error", () => {
      const mockConfig: AppConfigStructure = {
        site: "TestCore",
        resources: {
          items: {
            param: "item",
            schema: {
              code: {
                tag: "input",
                type: "number",
                min: 100,
                max: 10,
              },
            },
          },
        },
      };

      const report = validateConfig({ rawConfig: mockConfig });
      const boundIssue = report.issues.find(
        (i) => i.code === "INVERTED_MIN_MAX_BOUNDS",
      );
      assert.ok(boundIssue);
      assert.strictEqual(boundIssue?.severity, "error");
    });
  });

  describe("Cross-Resource Relations & RBAC Security", () => {
    it("should flag field matching another resource param as unlinked (UNLINKED_RESOURCE_RELATION)", () => {
      const mockConfig: AppConfigStructure = {
        site: "TestCore",
        resources: {
          roles: {
            param: "role",
            admin: true,
            schema: { name: { tag: "input", type: "text" } },
          },
          users: {
            param: "user",
            admin: true,
            schema: {
              name: 1,
              role: 1, // primitive projection flag
            },
          },
        },
      };

      const report = validateConfig({ rawConfig: mockConfig });
      const relationIssue = report.issues.find(
        (i) => i.code === "UNLINKED_RESOURCE_RELATION" && i.field === "role",
      );
      assert.ok(relationIssue);
      assert.strictEqual(relationIssue?.severity, "warning");
      assert.match(relationIssue!.message, /roles/);
    });

    it("should flag security privilege disparity when roles has admin: false while users has admin: true", () => {
      const mockConfig: AppConfigStructure = {
        site: "TestCore",
        resources: {
          roles: {
            param: "role",
            admin: false,
            schema: { name: { tag: "input", type: "text" } },
          },
          users: {
            param: "user",
            admin: true,
            schema: { name: 1 },
          },
        },
      };

      const report = validateConfig({ rawConfig: mockConfig });
      const disparityIssue = report.issues.find(
        (i) => i.code === "SECURITY_PRIVILEGE_DISPARITY",
      );
      assert.ok(disparityIssue);
      assert.strictEqual(disparityIssue?.severity, "warning");
    });

    it("should accept rich field with explicit ref to related resource", () => {
      const mockConfig: AppConfigStructure = {
        site: "TestCore",
        resources: {
          roles: {
            param: "role",
            admin: true,
            schema: { name: { tag: "input", type: "text" } },
          },
          users: {
            param: "user",
            admin: true,
            schema: {
              name: { tag: "input", type: "text" },
              role: { tag: "select", type: "text", ref: "roles" },
            },
          },
        },
      };

      const report = validateConfig({ rawConfig: mockConfig });
      const relationIssue = report.issues.find(
        (i) => i.code === "UNLINKED_RESOURCE_RELATION" && i.field === "role",
      );
      assert.strictEqual(relationIssue, undefined);
    });
  });

  describe("Form Tag Integrity", () => {
    it("should flag select tag without options or ref (SELECT_MISSING_OPTIONS)", () => {
      const mockConfig: AppConfigStructure = {
        site: "TestCore",
        resources: {
          tasks: {
            param: "task",
            schema: {
              status: {
                tag: "select",
                type: "text",
              },
            },
          },
        },
      };

      const report = validateConfig({ rawConfig: mockConfig });
      const selectIssue = report.issues.find(
        (i) => i.code === "SELECT_MISSING_OPTIONS",
      );
      assert.ok(selectIssue);
      assert.strictEqual(selectIssue?.severity, "warning");
    });

    it("should accept select tag when options are provided", () => {
      const mockConfig: AppConfigStructure = {
        site: "TestCore",
        resources: {
          tasks: {
            param: "task",
            schema: {
              status: {
                tag: "select",
                type: "text",
                options: ["todo", "done"],
              },
            },
          },
        },
      };

      const report = validateConfig({ rawConfig: mockConfig });
      const selectIssue = report.issues.find(
        (i) => i.code === "SELECT_MISSING_OPTIONS",
      );
      assert.strictEqual(selectIssue, undefined);
    });
  });

  describe("Collision and Missing Attribute Checks", () => {
    it("should flag page and resource collision as error", () => {
      const mockConfig: AppConfigStructure = {
        site: "TestCore",
        pages: ["products"],
        resources: {
          products: {
            param: "product",
            schema: { name: 1 },
          },
        },
      };

      const report = validateConfig({ rawConfig: mockConfig });
      const collisionIssue = report.issues.find(
        (i) => i.code === "PAGE_RESOURCE_COLLISION",
      );
      assert.ok(collisionIssue);
      assert.strictEqual(collisionIssue?.severity, "error");
    });

    it("should flag reserved core route collision as error", () => {
      const mockConfig: AppConfigStructure = {
        site: "TestCore",
        resources: {
          login: {
            param: "login",
            schema: { name: 1 },
          },
        },
      };

      const report = validateConfig({ rawConfig: mockConfig });
      const reservedIssue = report.issues.find(
        (i) => i.code === "RESERVED_ROUTE_COLLISION",
      );
      assert.ok(reservedIssue);
      assert.strictEqual(reservedIssue?.severity, "error");
    });

    it("should flag missing param as error", () => {
      const mockConfig: AppConfigStructure = {
        site: "TestCore",
        resources: {
          items: {
            schema: { name: 1 },
          },
        },
      };

      const report = validateConfig({ rawConfig: mockConfig });
      const missingParamIssue = report.issues.find(
        (i) => i.code === "RESOURCE_MISSING_PARAM",
      );
      assert.ok(missingParamIssue);
      assert.strictEqual(missingParamIssue?.severity, "error");
    });
  });
});
