import express, { type Express } from "express";
import * as commons from "./commons";
import * as account from "./account";
import { controllers } from "./controllers";
import * as generator from "../helpers/generator";
import * as inspector from "../helpers/inspector";
import * as middleware from "../helpers/middleware";
import config from "../src/config";

const resources = config.resources || {};

export const api: Express & { del?: any } = express();

// Security Headers, CORS, and Sanitization Middleware
api.use(middleware.securityHeaders);
api.use(middleware.corsGuard);
api.use(express.json());
api.use(express.urlencoded({ extended: true }));
api.use(middleware.sanitizeNoSql);

// Compatibility alias for restify .del()
(api as any).del = api.delete.bind(api);

api.use((req: any, _res: any, next: any) => {
  if (!req.params) req.params = {};
  req.params.token = req.headers?.token || req.headers?.authorization || false;
  next();
});

// Rate limiter for sensitive authentication endpoints
const authRateLimiter = middleware.rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message:
    "Too many authentication attempts. Please wait a minute and try again.",
});

inspector.addPluginsApi(api, controllers);

// Auto-generated dynamic CRUD routes
try {
  for (const route of Object.keys(resources)) {
    const resourceDef = (resources as Record<string, any>)[route];
    if (resourceDef?.exclude) {
      continue;
    }

    generator.addRoutes({
      api,
      route,
      admin: resourceDef?.admin,
      controller: controllers[route],
      schema: resourceDef?.schema,
      clean: resourceDef?.clean,
    });
  }
} catch (e) {
  console.error("[api.routes] Dynamic route generation error:", e);
}

// Custom endpoints
api.get("/", commons.ping);
api.get("/ping", commons.ping);
api.post("/login", authRateLimiter, commons.login);
api.get("/theme", commons.theme);
api.get("/properties", commons.properties);
api.post("/register/:email", authRateLimiter, commons.signup);
api.post("/recover/:email", authRateLimiter, commons.recover);
api.get("/email/confirm/:code", commons.confirm);
api.get("/email/recover/:code", commons.rescue);

api.get("/guest", account.guest);
api.get("/account", account.find);
api.post("/account", account.update);
api.post("/security", authRateLimiter, account.security);

export default api;
