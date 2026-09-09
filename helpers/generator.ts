import { Zappy, type ZappyProps } from "./zappy";
import config from "../config.json";

export interface RouteGeneratorOptions extends ZappyProps {
  api: any;
  route: string;
}

const site = config.site;
const theme = config.theme;
const AV = config.APIVARS || { PRE: "/api/1.0/", ID: "/:id" };

/**
 * Dynamically registers REST CRUD routes for an API server.
 */
export function addRoutes(opts: RouteGeneratorOptions): void {
  const zappy = new Zappy(opts);
  const prefix = AV.PRE || "/api/1.0/";
  const idParam = AV.ID || "/:id";

  opts.api.get(prefix + opts.route, (req: any, res: any) => {
    zappy.Get(req, res);
  });
  opts.api.get(prefix + opts.route + idParam, (req: any, res: any) => {
    zappy.GetOne(req, res);
  });
  if (typeof opts.api.del === "function") {
    opts.api.del(prefix + opts.route + idParam, (req: any, res: any) => {
      zappy.Del(req, res);
    });
  } else if (typeof opts.api.delete === "function") {
    opts.api.delete(prefix + opts.route + idParam, (req: any, res: any) => {
      zappy.Del(req, res);
    });
  }
  opts.api.post(prefix + opts.route, (req: any, res: any) => {
    zappy.Post(req, res);
  });
  opts.api.put(prefix + opts.route + idParam, (req: any, res: any) => {
    zappy.Put(req, res);
  });
}

/**
 * Dynamically registers web view routes for a model.
 */
export function addView(web: any, model: string): void {
  web.get(
    [`/${model}`, `/${model}/:id`, `/${model}/new`],
    (req: any, res: any) => {
      const id = req.params?.id;
      res.render("index/index", {
        id,
        site,
        model,
        theme,
      });
    },
  );
}

/**
 * Dynamically registers web page routes for a page name.
 */
export function addPage(web: any, name: string): void {
  web.get(`/${name}`, (_req: any, res: any) => {
    res.render(`${name}/index`, {
      site,
      model: false,
      theme,
    });
  });
}

export default {
  addRoutes,
  addView,
  addPage,
};
