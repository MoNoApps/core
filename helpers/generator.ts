import { ResourceHandler, type ResourceHandlerProps } from "./resource";
import config from "../config.json";

export interface RouteGeneratorOptions extends ResourceHandlerProps {
  api: any;
  route: string;
}

const AV = config.APIVARS || { PRE: "/api/1.0/", ID: "/:id" };

/**
 * Dynamically registers REST CRUD routes for an API server.
 */
export function addRoutes(opts: RouteGeneratorOptions): void {
  const handler = new ResourceHandler(opts);
  const prefix = AV.PRE || "/api/1.0/";
  const idParam = AV.ID || "/:id";

  opts.api.get(prefix + opts.route, (req: any, res: any) => {
    handler.Get(req, res);
  });
  opts.api.get(prefix + opts.route + "/count", (req: any, res: any) => {
    handler.Count(req, res);
  });
  opts.api.get(prefix + opts.route + idParam, (req: any, res: any) => {
    handler.GetOne(req, res);
  });
  if (typeof opts.api.del === "function") {
    opts.api.del(prefix + opts.route + idParam, (req: any, res: any) => {
      handler.Del(req, res);
    });
  } else if (typeof opts.api.delete === "function") {
    opts.api.delete(prefix + opts.route + idParam, (req: any, res: any) => {
      handler.Del(req, res);
    });
  }
  opts.api.post(prefix + opts.route, (req: any, res: any) => {
    handler.Post(req, res);
  });
  opts.api.put(prefix + opts.route + idParam, (req: any, res: any) => {
    handler.Put(req, res);
  });
}

export default {
  addRoutes,
};
