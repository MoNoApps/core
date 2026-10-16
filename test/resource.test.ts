import { describe, it } from "node:test";
import assert from "node:assert";
import { ResourceHandler } from "../helpers/resource";
import { models } from "../helpers/models";

describe("ResourceHandler Suite (helpers/resource.ts)", () => {
  const validToken = "507f1f77bcf86cd799439099";

  const setupAuth = () => {
    const origTokensFind = models.tokens.findById;
    const origUsersFind = models.users.findById;

    models.tokens.findById = async () =>
      ({
        _id: validToken,
        user: "u123",
        createdAt: Date.now(),
        expires: 84000,
      }) as any;
    models.users.findById = async () =>
      ({
        _id: "u123",
        email: "test@resource.co",
        admin: true,
      }) as any;

    return () => {
      models.tokens.findById = origTokensFind;
      models.users.findById = origUsersFind;
    };
  };

  it("should initialize with modern public readonly properties and backward-compatible getters", () => {
    const mockController = { list: async () => [] };
    const schema = { name: 1 };
    const clean = { password: 1 };

    // 1. Positional parameter properties
    const handlerPos = new ResourceHandler(
      mockController,
      "items",
      schema,
      true,
      clean,
    );
    assert.strictEqual(handlerPos.controller, mockController);
    assert.strictEqual(handlerPos.route, "items");
    assert.deepStrictEqual(handlerPos.schema, schema);
    assert.strictEqual(handlerPos.admin, true);
    assert.deepStrictEqual(handlerPos.clean, clean);

    // Backward-compatible getters

    // 2. Object options props
    const handlerProps = new ResourceHandler({
      controller: mockController,
      route: "users",
      schema,
      admin: false,
      clean,
    });
    assert.strictEqual(handlerProps.controller, mockController);
    assert.strictEqual(handlerProps.route, "users");
    assert.deepStrictEqual(handlerProps.schema, schema);
    assert.strictEqual(handlerProps.admin, false);
    assert.deepStrictEqual(handlerProps.clean, clean);
  });

  it("Get should fetch resource list and clean output", async () => {
    const restore = setupAuth();
    let capturedResponse: any = null;
    const mockController = {
      list: async () => [{ id: "item1", secret: "hide_me" }],
    };
    const handler = new ResourceHandler({
      controller: mockController,
      clean: { secret: 1 },
    });

    const mockReq = {
      headers: { token: validToken },
      params: {},
    };
    const mockRes = {
      status: (code: number) => ({
        json: (data: any) => {
          capturedResponse = { code, data };
        },
      }),
    };

    await handler.Get(mockReq, mockRes);
    assert.strictEqual(capturedResponse.code, 200);
    assert.strictEqual(capturedResponse.data[0].id, "item1");
    assert.strictEqual(capturedResponse.data[0].secret, undefined);

    restore();
  });

  it("Get should handle controller error gracefully and return 500", async (t) => {
    t.mock.method(console, "trace", () => {});
    const restore = setupAuth();
    let capturedResponse: any = null;
    const mockController = {
      list: async () => {
        throw new Error("Query Failed");
      },
    };
    const handler = new ResourceHandler({ controller: mockController });

    const mockReq = {
      headers: { token: validToken },
      params: {},
    };
    const mockRes = {
      status: (code: number) => ({
        json: (data: any) => {
          capturedResponse = { code, data };
        },
      }),
    };

    await handler.Get(mockReq, mockRes);
    assert.strictEqual(capturedResponse.code, 500);

    restore();
  });

  it("GetOne should fetch resource by ID and return response", async () => {
    const restore = setupAuth();
    let capturedResponse: any = null;
    const mockController = {
      findById: async (id: string) => ({ _id: id, title: "Item Found" }),
    };
    const handler = new ResourceHandler({ controller: mockController });

    const mockReq = {
      params: { id: "123" },
      headers: { token: validToken },
    };
    const mockRes = {
      status: (code: number) => ({
        json: (data: any) => {
          capturedResponse = { code, data };
        },
      }),
    };

    await handler.GetOne(mockReq, mockRes);
    assert.strictEqual(capturedResponse.code, 200);
    assert.strictEqual(capturedResponse.data.title, "Item Found");

    restore();
  });

  it("GetOne should handle findById errors and return 500", async (t) => {
    t.mock.method(console, "trace", () => {});
    const restore = setupAuth();
    let capturedResponse: any = null;
    const mockController = {
      findById: async () => {
        throw new Error("Find error");
      },
    };
    const handler = new ResourceHandler({ controller: mockController });

    const mockReq = {
      params: { id: "123" },
      headers: { token: validToken },
    };
    const mockRes = {
      status: (code: number) => ({
        json: (data: any) => {
          capturedResponse = { code, data };
        },
      }),
    };

    await handler.GetOne(mockReq, mockRes);
    assert.strictEqual(capturedResponse.code, 500);

    restore();
  });

  it("Del should invoke controller deleteById on authenticated request", async () => {
    const restore = setupAuth();
    let capturedResponse: any = null;
    let deletedId = "";
    const mockController = {
      deleteById: async (id: string) => {
        deletedId = id;
        return true;
      },
    };
    const handler = new ResourceHandler({ controller: mockController });

    const mockReq = {
      params: { id: "del_123" },
      headers: { token: validToken },
    };
    const mockRes = {
      status: (code: number) => ({
        json: (data: any) => {
          capturedResponse = { code, data };
        },
      }),
    };

    await handler.Del(mockReq, mockRes);
    assert.strictEqual(deletedId, "del_123");
    assert.strictEqual(capturedResponse.code, 200);

    restore();
  });

  it("Del should handle deleteById rejection", async (t) => {
    t.mock.method(console, "trace", () => {});
    const restore = setupAuth();
    let capturedResponse: any = null;
    const mockController = {
      deleteById: async () => {
        throw new Error("Delete failed");
      },
    };
    const handler = new ResourceHandler({ controller: mockController });

    const mockReq = {
      params: { id: "del_123" },
      headers: { token: validToken },
    };
    const mockRes = {
      status: (code: number) => ({
        json: (data: any) => {
          capturedResponse = { code, data };
        },
      }),
    };

    await handler.Del(mockReq, mockRes);
    assert.strictEqual(capturedResponse.code, 500);

    restore();
  });

  it("Post should create new resource with userId and createdAt", async () => {
    const restore = setupAuth();
    let capturedResponse: any = null;
    let createdPayload: any = null;
    const mockController = {
      create: async (doc: any) => {
        createdPayload = doc;
        return { ...doc, _id: "new_created" };
      },
    };
    const handler = new ResourceHandler({ controller: mockController });

    const mockReq = {
      params: { name: "New Resource" },
      headers: { token: validToken },
    };
    const mockRes = {
      status: (code: number) => ({
        json: (data: any) => {
          capturedResponse = { code, data };
        },
      }),
    };

    await handler.Post(mockReq, mockRes);
    assert.strictEqual(capturedResponse.code, 200);
    assert.strictEqual(createdPayload.userId, "u123");
    assert.ok(createdPayload.createdAt);

    restore();
  });

  it("Post should handle create errors and return 500", async (t) => {
    t.mock.method(console, "trace", () => {});
    const restore = setupAuth();
    let capturedResponse: any = null;
    const mockController = {
      create: async () => {
        throw new Error("Creation error");
      },
    };
    const handler = new ResourceHandler({ controller: mockController });

    const mockReq = {
      params: { name: "New Resource" },
      headers: { token: validToken },
    };
    const mockRes = {
      status: (code: number) => ({
        json: (data: any) => {
          capturedResponse = { code, data };
        },
      }),
    };

    await handler.Post(mockReq, mockRes);
    assert.strictEqual(capturedResponse.code, 500);

    restore();
  });

  it("Put should strip restricted fields and update document", async () => {
    const restore = setupAuth();
    let capturedResponse: any = null;
    let updatedId = "";
    let updateOps: any = null;
    const mockController = {
      updateById: async (id: string, ops: any) => {
        updatedId = id;
        updateOps = ops;
        return true;
      },
    };
    const handler = new ResourceHandler({
      controller: mockController,
      schema: { name: 1 },
    });

    const mockReq = {
      params: { id: "item_put" },
      body: {
        _id: "fake_id",
        token: "fake_token",
        admin: true,
        userId: "fake_user",
        createdAt: 1000,
        updatedAt: 2000,
        updatedBy: "fake_updater",
        name: "Legit",
      },
      headers: { token: validToken },
    };
    const mockRes = {
      status: (code: number) => ({
        json: (data: any) => {
          capturedResponse = { code, data };
        },
      }),
    };

    await handler.Put(mockReq, mockRes);
    assert.strictEqual(updatedId, "item_put");
    assert.strictEqual(updateOps.$set.name, "Legit");
    assert.strictEqual(updateOps.$set._id, undefined);
    assert.strictEqual(updateOps.$set.token, undefined);
    assert.strictEqual(updateOps.$set.admin, undefined);
    assert.strictEqual(capturedResponse.code, 200);

    restore();
  });

  it("Put should handle updateById rejection", async (t) => {
    t.mock.method(console, "trace", () => {});
    const restore = setupAuth();
    let capturedResponse: any = null;
    const mockController = {
      updateById: async () => {
        throw new Error("Update error");
      },
    };
    const handler = new ResourceHandler({
      controller: mockController,
      schema: { name: 1 },
    });

    const mockReq = {
      params: { id: "item_put" },
      body: { name: "Legit" },
      headers: { token: validToken },
    };
    const mockRes = {
      status: (code: number) => ({
        json: (data: any) => {
          capturedResponse = { code, data };
        },
      }),
    };

    await handler.Put(mockReq, mockRes);
    assert.strictEqual(capturedResponse.code, 500);

    restore();
  });

  it("All methods should reject unauthenticated requests with 401", async () => {
    let capturedCode = 0;
    const mockRes = {
      status: (code: number) => {
        capturedCode = code;
        return { json: () => {} };
      },
    };
    const handler = new ResourceHandler({ controller: {} });

    await handler.Get({ headers: {}, params: {} }, mockRes);
    assert.strictEqual(capturedCode, 401);

    await handler.GetOne({ headers: {}, params: {} }, mockRes);
    assert.strictEqual(capturedCode, 401);

    await handler.Del({ headers: {}, params: {} }, mockRes);
    assert.strictEqual(capturedCode, 401);

    await handler.Post({ headers: {}, params: {} }, mockRes);
    assert.strictEqual(capturedCode, 401);

    await handler.Put({ headers: {}, params: {} }, mockRes);
    assert.strictEqual(capturedCode, 401);

    await handler.Count({ headers: {}, params: {} }, mockRes);
    assert.strictEqual(capturedCode, 401);
  });

  it("Count should return exact count on authenticated request", async () => {
    const restore = setupAuth();
    let capturedResponse: any = null;
    const mockController = {
      count: async () => 42,
    };
    const handler = new ResourceHandler({
      controller: mockController,
    });

    const mockReq = {
      headers: { token: validToken },
      params: {},
    };
    const mockRes = {
      status: (code: number) => ({
        json: (data: any) => {
          capturedResponse = { code, data };
        },
      }),
    };

    await handler.Count(mockReq, mockRes);
    assert.strictEqual(capturedResponse.code, 200);
    assert.strictEqual(capturedResponse.data.count, 42);

    restore();
  });

  it("Get should pass pagination limit and skip from req.query to list", async () => {
    const restore = setupAuth();
    let passedOptions: any = null;
    const mockController = {
      list: async (_query: any, options: any) => {
        passedOptions = options;
        return [];
      },
    };
    const handler = new ResourceHandler({
      controller: mockController,
    });

    const mockReq = {
      headers: { token: validToken },
      params: {},
      query: { limit: "25", skip: "50" },
    };
    const mockRes = {
      status: () => ({
        json: () => {},
      }),
    };

    await handler.Get(mockReq, mockRes);
    assert.deepStrictEqual(passedOptions, { limit: 25, skip: 50 });

    restore();
  });

  it("Get should invoke paginate when req.query.page is provided", async () => {
    const restore = setupAuth();
    let paginateCalledWith: any = null;
    const mockEnvelope = {
      data: [{ _id: "1", name: "Item" }],
      pagination: {
        page: 2,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: true,
      },
    };
    const mockController = {
      paginate: async (q: any, opts: any) => {
        paginateCalledWith = { q, opts };
        return mockEnvelope;
      },
    };
    const handler = new ResourceHandler({ controller: mockController });
    let captured: any = null;
    const mockReq = {
      headers: { token: validToken },
      params: {},
      query: { page: "2", limit: "10", sort: "name", order: "asc" },
    };
    const mockRes = {
      status: (code: number) => ({
        json: (data: any) => {
          captured = { code, data };
        },
      }),
    };

    await handler.Get(mockReq, mockRes);
    assert.strictEqual(captured.code, 200);
    assert.strictEqual(paginateCalledWith.opts.page, 2);
    assert.strictEqual(paginateCalledWith.opts.limit, 10);
    assert.deepStrictEqual(paginateCalledWith.opts.sort, { name: 1 });
    assert.deepStrictEqual(captured.data, mockEnvelope);

    restore();
  });

  it("Get should invoke cursor when req.query.after is provided", async () => {
    const restore = setupAuth();
    let cursorCalledWith: any = null;
    const mockCursorEnvelope = {
      data: [{ _id: "607f", name: "CursorItem" }],
      pageInfo: {
        limit: 15,
        hasNextPage: true,
        endCursor: "NjA3Zg==",
      },
    };
    const mockController = {
      cursor: async (q: any, opts: any) => {
        cursorCalledWith = { q, opts };
        return mockCursorEnvelope;
      },
    };
    const handler = new ResourceHandler({ controller: mockController });
    let captured: any = null;
    const mockReq = {
      headers: { token: validToken },
      params: {},
      query: { after: "Y3Vyc29y", limit: "15" },
    };
    const mockRes = {
      status: (code: number) => ({
        json: (data: any) => {
          captured = { code, data };
        },
      }),
    };

    await handler.Get(mockReq, mockRes);
    assert.strictEqual(captured.code, 200);
    assert.strictEqual(cursorCalledWith.opts.after, "Y3Vyc29y");
    assert.strictEqual(cursorCalledWith.opts.limit, 15);
    assert.deepStrictEqual(captured.data, mockCursorEnvelope);

    restore();
  });
});
