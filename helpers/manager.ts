import * as filters from "./filters";
import type { User, AuthToken } from "../src/types/index";

export interface ResponseOptions {
  req?: any;
  res: any;
  err?: any;
  rsp?: any;
  clean?: Record<string, unknown>;
}

export interface ReviewOptions {
  req: any;
  res: any;
  /** Resource handler under review; supplies the schema whitelist. */
  handler?: { schema?: Record<string, boolean | number> };
  admin?: boolean;
  schema?: boolean;
  user?: User;
  token?: AuthToken;
}

/**
 * Standardized HTTP status response helper for Express 5.
 */
function sendStatus(res: any, code: number, payload?: any): void {
  if (typeof res.status === "function") {
    const s = res.status(code);
    const target =
      s && (typeof s.json === "function" || typeof s.send === "function")
        ? s
        : res;

    if (payload !== undefined) {
      if (typeof payload === "object" && typeof target.json === "function") {
        target.json(payload);
      } else if (typeof target.send === "function") {
        target.send(payload);
      } else if (typeof target.json === "function") {
        target.json(payload);
      }
    } else {
      if (typeof res.sendStatus === "function") {
        res.sendStatus(code);
      } else if (typeof target.send === "function") {
        target.send(String(code));
      } else if (typeof target.json === "function") {
        target.json({ status: code });
      }
    }
  } else if (typeof res.send === "function") {
    res.send(code, payload);
  }
}

/**
 * Output / response manager sending structured JSON or status codes with try/catch.
 */
export function response(opts: ResponseOptions): void {
  try {
    if (opts.err) {
      if (process.env.NODE_ENV !== "test" || process.env.DEBUG) {
        console.trace(opts.err);
      }
      return sendStatus(opts.res, 500, { error: opts.err });
    }
    if (!opts.rsp && opts.rsp !== 0 && opts.rsp !== false) {
      return sendStatus(opts.res, 404, { message: "Not Found" });
    }
    if (opts.rsp === 1) {
      return sendStatus(opts.res, 200, { message: "OK" });
    }
    if (opts.clean) {
      const cleaned = filters.cleanObject(opts.rsp, opts.clean);
      return sendStatus(opts.res, 200, cleaned);
    }
    return sendStatus(opts.res, 200, opts.rsp);
  } catch (error) {
    if (process.env.NODE_ENV !== "test" || process.env.DEBUG) {
      console.error("[manager.response] Error formatting response:", error);
    }
    sendStatus(opts.res, 500, { error: "Internal Server Error" });
  }
}

/**
 * Input / auth / schema review manager middleware using async/await with try/catch.
 */
export async function review(
  opts: ReviewOptions,
  cb?: (err: any, opt: ReviewOptions) => void,
): Promise<ReviewOptions | null> {
  try {
    const token =
      opts.req?.params?.token ||
      opts.req?.headers?.token ||
      opts.req?.headers?.authorization;

    if (!token) {
      sendStatus(opts.res, 401, { error: "Missing token" });
      return null;
    }

    const authResult = await filters.authenticateToken(token);
    if (!authResult) {
      sendStatus(opts.res, 401, { error: "Invalid token" });
      return null;
    }

    if (authResult.expired) {
      sendStatus(opts.res, 401, { error: "Token expired" });
      return null;
    }

    if (!authResult.user || !authResult.token) {
      sendStatus(opts.res, 401, { error: "Invalid token" });
      return null;
    }

    opts.user = authResult.user;
    opts.token = authResult.token;

    if (opts.admin && !filters.checkAdmin(authResult.user)) {
      sendStatus(opts.res, 401, { error: "Admin access required" });
      return null;
    }

    const schemaDef = opts.handler?.schema;
    if (opts.schema && schemaDef) {
      if (opts.req.body) {
        delete opts.req.body.token;
      }
      try {
        filters.validateSchema(opts.req.body || {}, schemaDef);
      } catch (schemaErr) {
        if (process.env.NODE_ENV !== "test" || process.env.DEBUG) {
          console.trace(schemaErr);
        }
        sendStatus(opts.res, 401, { error: (schemaErr as Error).message });
        return null;
      }
    }

    if (cb) {
      cb(null, opts);
    }
    return opts;
  } catch (error) {
    if (process.env.NODE_ENV !== "test" || process.env.DEBUG) {
      console.trace(error);
    }
    sendStatus(opts.res, 401, { error: "Authentication failed" });
    if (cb) cb(error, opts);
    return null;
  }
}

export default {
  response,
  review,
};
