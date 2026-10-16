import { review, response as managerResponse } from "./manager";
import { publishChange } from "./ps";
import type { BaseController } from "./base";

/**
 * Controller operations consumed by `ResourceHandler`. Structurally satisfied by
 * `BaseController`; every operation is optional so lightweight or plugin
 * controllers may implement only the endpoints they expose.
 */
export type ResourceOperations = Partial<
  Pick<
    BaseController,
    | "list"
    | "paginate"
    | "cursor"
    | "count"
    | "findById"
    | "deleteById"
    | "create"
    | "updateById"
  >
>;

type ResourceOperation = keyof ResourceOperations;

export interface ResourceHandlerProps {
  controller: ResourceOperations;
  route?: string;
  schema?: Record<string, boolean | number>;
  admin?: boolean;
  clean?: Record<string, unknown>;
}

export class ResourceHandler {
  public readonly controller: ResourceOperations;
  public readonly route?: string;
  public readonly schema?: Record<string, boolean | number>;
  public readonly admin?: boolean;
  public readonly clean?: Record<string, unknown>;

  constructor(props: ResourceHandlerProps);
  constructor(
    controller: ResourceOperations,
    route?: string,
    schema?: Record<string, boolean | number>,
    admin?: boolean,
    clean?: Record<string, unknown>,
  );
  constructor(
    propsOrController: ResourceHandlerProps | ResourceOperations,
    route?: string,
    schema?: Record<string, boolean | number>,
    admin?: boolean,
    clean?: Record<string, unknown>,
  ) {
    if (
      propsOrController &&
      typeof propsOrController === "object" &&
      ("controller" in propsOrController ||
        "route" in propsOrController ||
        "schema" in propsOrController ||
        "admin" in propsOrController ||
        "clean" in propsOrController)
    ) {
      const props = propsOrController as ResourceHandlerProps;
      this.controller = props.controller;
      this.route = props.route;
      this.schema = props.schema;
      this.admin = props.admin;
      this.clean = props.clean;
    } else {
      this.controller = propsOrController;
      this.route = route;
      this.schema = schema;
      this.admin = admin;
      this.clean = clean;
    }
  }

  /**
   * Resolves a required controller operation bound to the controller,
   * throwing a descriptive error (surfaced as HTTP 500) when absent.
   */
  private operation<K extends ResourceOperation>(
    name: K,
  ): NonNullable<ResourceOperations[K]> {
    const fn = this.controller[name];
    if (typeof fn !== "function") {
      throw new Error(
        `Controller for "${this.route}" does not implement ${name}`,
      );
    }
    return fn.bind(this.controller) as NonNullable<ResourceOperations[K]>;
  }

  async Get(req: any, res: any): Promise<void> {
    try {
      const ge = { req, res, handler: this, admin: this.admin };
      const cl = this.clean;
      const opt = await review(ge);
      if (!opt) return;

      let sort: Record<string, 1 | -1> | undefined;
      if (req.query?.sort) {
        const sortField = String(req.query.sort);
        const sortOrder =
          req.query.order === "asc" || req.query.order === "1" ? 1 : -1;
        sort = { [sortField]: sortOrder };
      }

      // Tier 2: Keyset / Cursor Pagination
      if (req.query?.after && typeof this.controller.cursor === "function") {
        const lim = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
        const result = await this.controller.cursor(
          {},
          {
            after: String(req.query.after),
            limit:
              !isNaN(lim as number) && (lim as number) > 0 ? lim : undefined,
            sort,
          },
        );
        managerResponse({ req, res, rsp: result, clean: cl });
        return;
      }

      // Tier 1: Offset Pagination
      if (req.query?.page && typeof this.controller.paginate === "function") {
        const page = parseInt(req.query.page, 10);
        const lim = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
        const result = await this.controller.paginate(
          {},
          {
            page: !isNaN(page) && page > 0 ? page : 1,
            limit:
              !isNaN(lim as number) && (lim as number) > 0 ? lim : undefined,
            sort,
          },
        );
        managerResponse({ req, res, rsp: result, clean: cl });
        return;
      }

      // Backward compatible array listing
      const options: {
        limit?: number;
        skip?: number;
        sort?: Record<string, 1 | -1>;
      } = {};
      if (req.query?.limit) {
        const lim = parseInt(req.query.limit, 10);
        if (!isNaN(lim) && lim > 0) options.limit = lim;
      }
      if (req.query?.skip) {
        const sk = parseInt(req.query.skip, 10);
        if (!isNaN(sk) && sk >= 0) options.skip = sk;
      }
      if (sort) {
        options.sort = sort;
      }

      const rsp = await this.operation("list")({}, options);
      managerResponse({ req, res, rsp, clean: cl });
    } catch (err) {
      managerResponse({ req, res, err, clean: this.clean });
    }
  }

  async Count(req: any, res: any): Promise<void> {
    try {
      const ge = { req, res, handler: this, admin: this.admin };
      const opt = await review(ge);
      if (!opt) return;

      let count = 0;
      if (typeof this.controller.count === "function") {
        count = await this.controller.count({});
      }
      managerResponse({ req, res, rsp: { count } });
    } catch (err) {
      managerResponse({ req, res, err });
    }
  }

  async GetOne(req: any, res: any): Promise<void> {
    try {
      const go = { req, res, handler: this, admin: this.admin };
      const opt = await review(go);
      if (!opt) return;

      const rsp = await this.operation("findById")(req.params.id);
      managerResponse({ req, res, rsp });
    } catch (err) {
      managerResponse({ req, res, err });
    }
  }

  async Del(req: any, res: any): Promise<void> {
    try {
      const de = { req, res, handler: this, admin: this.admin };
      const opt = await review(de);
      if (!opt) return;

      if (opt.user?.role === "viewer") {
        res.status(403).json({
          success: false,
          error: "Forbidden: Viewer accounts have read-only access.",
        });
        return;
      }

      const rsp = await this.operation("deleteById")(req.params.id);
      managerResponse({ req, res, rsp });

      // Publish change event to Redis pub/sub
      publishChange({
        resource: this.route || "resource",
        action: "delete",
        id: String(req.params?.id || ""),
        userId: opt.user?._id ? String(opt.user._id) : undefined,
        timestamp: Date.now(),
      });
    } catch (err) {
      managerResponse({ req, res, err });
    }
  }

  async Post(req: any, res: any): Promise<void> {
    try {
      const po = { req, res, handler: this, admin: this.admin };
      const opt = await review(po);
      if (!opt) return;

      if (opt.user?.role === "viewer") {
        res.status(403).json({
          success: false,
          error: "Forbidden: Viewer accounts have read-only access.",
        });
        return;
      }

      const payload: Record<string, any> = {
        ...(req.body || {}),
        ...(req.params || {}),
      };
      delete payload.token;
      delete payload._id;
      payload.userId = opt.user?._id;
      payload.createdAt = Date.now();

      const rsp = await this.operation("create")(payload);
      managerResponse({ req, res, rsp });

      // Publish change event to Redis pub/sub
      publishChange({
        resource: this.route || "resource",
        action: "create",
        id: rsp?._id ? String(rsp._id) : undefined,
        userId: opt.user?._id ? String(opt.user._id) : undefined,
        timestamp: Date.now(),
      });
    } catch (err) {
      managerResponse({ req, res, err });
    }
  }

  async Put(req: any, res: any): Promise<void> {
    try {
      if (req.body) {
        delete req.body._id;
        delete req.body.token;
        delete req.body.admin;
        delete req.body.userId;
        delete req.body.createdAt;
        delete req.body.updatedAt;
        delete req.body.updatedBy;
      }

      const pu = { req, res, handler: this, admin: this.admin, schema: true };
      const opt = await review(pu);
      if (!opt) return;

      if (opt.user?.role === "viewer") {
        res.status(403).json({
          success: false,
          error: "Forbidden: Viewer accounts have read-only access.",
        });
        return;
      }

      req.params.updatedAt = Date.now();
      req.params.updatedBy = opt.user?._id;

      const rsp = await this.operation("updateById")(req.params.id, {
        $set: req.body,
      });
      managerResponse({ req, res, rsp });

      // Publish change event to Redis pub/sub
      publishChange({
        resource: this.route || "resource",
        action: "update",
        id: String(req.params?.id || ""),
        userId: opt.user?._id ? String(opt.user._id) : undefined,
        timestamp: Date.now(),
      });
    } catch (err) {
      managerResponse({ req, res, err });
    }
  }
}

export default ResourceHandler;
