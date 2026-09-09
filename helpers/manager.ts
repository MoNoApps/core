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
  zap?: any;
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
    if (payload !== undefined) {
      if (typeof payload === "object" && typeof res.json === "function") {
        res.status(code).json(payload);
      } else {
        res.status(code).send(payload);
      }
    } else {
      res.sendStatus
        ? res.sendStatus(code)
        : res.status(code).send(String(code));
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
      console.trace(opts.err);
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
    console.error("[manager.response] Error formatting response:", error);
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

    if (opts.schema && opts.zap?.sc) {
      if (opts.req.body) {
        delete opts.req.body.token;
      }
      try {
        filters.validateSchema(opts.req.body || {}, opts.zap.sc);
      } catch (schemaErr) {
        console.trace(schemaErr);
        sendStatus(opts.res, 401, { error: (schemaErr as Error).message });
        return null;
      }
    }

    if (cb) {
      cb(null, opts);
    }
    return opts;
  } catch (error) {
    console.trace(error);
    sendStatus(opts.res, 401, { error: "Authentication failed" });
    if (cb) cb(error, opts);
    return null;
  }
}

export default {
  response,
  review,
};
