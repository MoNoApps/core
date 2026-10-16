import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import * as inspector from "../helpers/inspector";
import * as controllersModule from "../api/controllers";
import { initializeModels, models } from "../helpers/models";

describe("Plugin Inspector & Controller Definitions (helpers/inspector.ts & api/controllers.ts)", () => {
  const pluginDir = path.resolve(process.cwd(), "plugins/wizard");
  const pluginFile = path.join(pluginDir, "plugin.js");
  const configFile = path.join(pluginDir, "config.json");
  let createdPluginFile = false;
  let createdConfigFile = false;

  before(() => {
    fs.mkdirSync(pluginDir, { recursive: true });
    if (!fs.existsSync(configFile)) {
      createdConfigFile = true;
      fs.writeFileSync(
        configFile,
        JSON.stringify({ dburl: "mongodb://127.0.0.1/wizard", resources: {} }),
      );
    }
    if (!fs.existsSync(pluginFile)) {
      createdPluginFile = true;
      fs.writeFileSync(
        pluginFile,
        `module.exports = {
  api: {
    GET: [
      { route: "analize", fn: () => {}, params: {} },
      { route: "analize", fn: () => {}, params: { model: "model" } },
      { route: "targets", fn: () => {}, params: {} },
    ],
    POST: [
      { route: "generate", fn: () => {}, params: {} },
      { route: "destroy", fn: () => {}, params: {} },
    ],
  },
};`,
      );
    }
  });

  after(() => {
    if (createdPluginFile && fs.existsSync(pluginFile)) {
      try {
        fs.unlinkSync(pluginFile);
      } catch {}
    }
    if (createdConfigFile && fs.existsSync(configFile)) {
      try {
        fs.unlinkSync(configFile);
      } catch {}
    }
  });

  it("addResourceRoutes should register dynamic routes for resources not excluded", () => {
    const registeredRoutes: string[] = [];
    const mockApi = {
      get: (route: string) => registeredRoutes.push(`GET ${route}`),
      post: (route: string) => registeredRoutes.push(`POST ${route}`),
      put: (route: string) => registeredRoutes.push(`PUT ${route}`),
      delete: (route: string) => registeredRoutes.push(`DELETE ${route}`),
    };

    const mockResources = {
      articles: {
        admin: false,
        schema: { title: "string" },
        clean: ["internalId"],
      },
      secretNotes: {
        exclude: true,
      },
    };

    inspector.addResourceRoutes(mockResources, mockApi, {
      articles: { list: async () => [] },
    });

    assert.ok(registeredRoutes.includes("GET /articles"));
    assert.ok(registeredRoutes.includes("POST /articles"));
    assert.ok(!registeredRoutes.some((r) => r.includes("secretNotes")));
  });

  it("addPluginsApi should register routes from configured plugins submodule", () => {
    const routes: string[] = [];
    const mockApi = {
      get: (route: string) => routes.push(`GET ${route}`),
      post: (route: string) => routes.push(`POST ${route}`),
      put: (route: string) => routes.push(`PUT ${route}`),
      del: (route: string) => routes.push(`DEL ${route}`),
    };

    inspector.addPluginsApi(mockApi, {});
    assert.ok(routes.includes("GET /wizard/analize"));
    assert.ok(routes.includes("GET /wizard/analize/:model"));
    assert.ok(routes.includes("GET /wizard/targets"));
    assert.ok(routes.includes("POST /wizard/generate"));
    assert.ok(routes.includes("POST /wizard/destroy"));
  });

  it("addPluginsApi should support DELETE and PUT routes with api.del", () => {
    const routes: string[] = [];
    const mockApi = {
      get: (route: string) => routes.push(`GET ${route}`),
      post: (route: string) => routes.push(`POST ${route}`),
      put: (route: string) => routes.push(`PUT ${route}`),
      del: (route: string) => routes.push(`DEL ${route}`),
    };

    const origModule = require.cache[pluginFile];
    require.cache[pluginFile] = {
      id: pluginFile,
      filename: pluginFile,
      loaded: true,
      exports: {
        api: {
          PUT: [{ route: "update", fn: () => {} }],
          DELETE: [{ route: "remove", params: { id: "id" }, fn: () => {} }],
        },
      },
    } as any;

    try {
      inspector.addPluginsApi(mockApi, {});
      assert.ok(routes.some((r) => r.startsWith("DEL /wizard/remove/:id")));
      assert.ok(routes.some((r) => r.startsWith("PUT /wizard/update")));
    } finally {
      if (origModule) {
        require.cache[pluginFile] = origModule;
      } else {
        delete require.cache[pluginFile];
      }
    }
  });

  it("addPluginsApi should support api.delete fallback when api.del is not defined", () => {
    const routes: string[] = [];
    const mockApi = {
      get: () => {},
      post: () => {},
      put: () => {},
      delete: (route: string) => routes.push(`DELETE ${route}`),
    };

    const origModule = require.cache[pluginFile];
    require.cache[pluginFile] = {
      id: pluginFile,
      filename: pluginFile,
      loaded: true,
      exports: {
        api: {
          DELETE: [{ route: "remove", params: { id: "id" }, fn: () => {} }],
        },
      },
    } as any;

    try {
      inspector.addPluginsApi(mockApi, {});
      assert.ok(routes.some((r) => r.startsWith("DELETE /wizard/remove/:id")));
    } finally {
      if (origModule) {
        require.cache[pluginFile] = origModule;
      } else {
        delete require.cache[pluginFile];
      }
    }
  });

  it("addPluginsWeb should safely inspect plugins and mount static public assets if present", () => {
    const usedMiddlewares: any[] = [];
    const mockWeb = {
      use: (mw: any) => usedMiddlewares.push(mw),
    };
    const mockStatic = (dir: string) => `static:${dir}`;

    const mounted = inspector.addPluginsWeb(mockWeb, mockStatic);
    assert.ok(Array.isArray(mounted));
  });

  it("initializeModels should discover plugin resources and register ModernModel", () => {
    const origExistsSync = fs.existsSync;
    const origReadFileSync = fs.readFileSync;

    (fs as any).existsSync = (p: string) => {
      if (
        typeof p === "string" &&
        p.includes("wizard") &&
        p.includes("config.json")
      ) {
        return true;
      }
      return origExistsSync(p);
    };

    (fs as any).readFileSync = (filePath: string, enc: any) => {
      if (
        typeof filePath === "string" &&
        filePath.includes("wizard") &&
        filePath.includes("config.json")
      ) {
        return JSON.stringify({
          resources: {
            wizard_items: { schema: { title: "string" } },
          },
        });
      }
      return origReadFileSync(filePath, enc);
    };

    try {
      initializeModels();
      assert.ok(models.wizard_items);
      assert.strictEqual(models.wizard_items.name, "wizard_items");
    } finally {
      (fs as any).existsSync = origExistsSync;
      (fs as any).readFileSync = origReadFileSync;
    }
  });

  it("defineModels in api/controllers.ts should define BaseController controllers", () => {
    controllersModule.defineModels({
      custom_resource: { schema: { title: "string" } },
    });
    assert.ok(controllersModule.controllers.custom_resource);
    assert.strictEqual(
      typeof controllersModule.controllers.custom_resource.list,
      "function",
    );
  });

  it("defineModelsFromPlugins should create controllers for discovered plugin resources", () => {
    const origExistsSync = fs.existsSync;
    const origReadFileSync = fs.readFileSync;

    (fs as any).existsSync = (p: string) => {
      if (
        typeof p === "string" &&
        p.includes("wizard") &&
        p.includes("config.json")
      ) {
        return true;
      }
      return origExistsSync(p);
    };

    (fs as any).readFileSync = (filePath: string, enc: any) => {
      if (
        typeof filePath === "string" &&
        filePath.includes("wizard") &&
        filePath.includes("config.json")
      ) {
        return JSON.stringify({
          resources: {
            wizard_items: { schema: { title: "string" } },
          },
        });
      }
      return origReadFileSync(filePath, enc);
    };

    try {
      controllersModule.defineModelsFromPlugins();
      assert.ok(controllersModule.controllers.wizard_items);
      assert.strictEqual(
        typeof controllersModule.controllers.wizard_items.list,
        "function",
      );
    } finally {
      (fs as any).existsSync = origExistsSync;
      (fs as any).readFileSync = origReadFileSync;
    }
  });

  it("should handle invalid plugin config gracefully without throwing", (t) => {
    t.mock.method(console, "warn", () => {});
    t.mock.method(console, "error", () => {});
    const origReadFileSync = fs.readFileSync;
    (fs as any).readFileSync = (filePath: string, enc: any) => {
      if (typeof filePath === "string" && filePath.includes("config.json")) {
        throw new Error("Simulated corrupt JSON");
      }
      return origReadFileSync(filePath, enc);
    };

    assert.doesNotThrow(() => controllersModule.defineModelsFromPlugins());
    assert.doesNotThrow(() => initializeModels());
    assert.doesNotThrow(() => inspector.addPluginsApi({}, {}));
    assert.doesNotThrow(() =>
      inspector.addPluginsWeb({ use: () => {} }, () => () => {}),
    );

    (fs as any).readFileSync = origReadFileSync;
  });
});
