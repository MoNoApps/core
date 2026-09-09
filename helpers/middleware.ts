import type { Request, Response, NextFunction } from "express";
import config from "../config.json";

// In-memory token bucket store for rate limiting
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up expired rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000).unref();

export function securityHeaders(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "0");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(), camera=(), microphone=()",
  );
  next();
}

export function corsGuard(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const origin = req.headers.origin;
  const allowedBase = config.URL?.BASE;

  if (origin) {
    if (
      !allowedBase ||
      allowedBase === "*" ||
      origin === allowedBase ||
      origin.startsWith("http://localhost:") ||
      origin.startsWith("http://127.0.0.1:")
    ) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, token, Authorization",
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
}

export interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

export function rateLimit(options: RateLimitOptions = {}) {
  const windowMs = options.windowMs || 60 * 1000;
  const max = options.max || 100;
  const message =
    options.message ||
    "Too many requests from this IP, please try again later.";

  return function rateLimiterMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const ip =
      options.keyGenerator?.(req) ||
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.ip ||
      req.socket.remoteAddress ||
      "unknown";

    const key = `${req.baseUrl || ""}${req.path}:${ip}`;
    const now = Date.now();
    let record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      rateLimitStore.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    res.setHeader("RateLimit-Limit", max);
    res.setHeader("RateLimit-Remaining", remaining);
    res.setHeader(
      "RateLimit-Reset",
      Math.ceil((record.resetTime - now) / 1000),
    );

    if (record.count > max) {
      res.status(429).json({
        success: false,
        error: message,
      });
      return;
    }

    next();
  };
}

/**
 * Recursively strips dangerous NoSQL injection operators (e.g. $where, $regex, $gt, $ne, $expr).
 */
export function sanitizeObject<T = any>(obj: T): T {
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject) as unknown as T;
  }

  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith("$") || key.includes(".")) {
      continue;
    }
    clean[key] = sanitizeObject(value);
  }
  return clean as T;
}

export function sanitizeInPlace(obj: any): void {
  if (!obj || typeof obj !== "object") return;
  for (const key of Object.keys(obj)) {
    if (key.startsWith("$") || key.includes(".")) {
      delete obj[key];
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      sanitizeInPlace(obj[key]);
    }
  }
}

export function sanitizeNoSql(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (req.query && typeof req.query === "object") {
    sanitizeInPlace(req.query);
  }
  if (req.body && typeof req.body === "object") {
    sanitizeInPlace(req.body);
  }
  next();
}

export function browser(req: Request, res: Response, next: NextFunction): void {
  const regex = /(MSIE [1-3]\.0|Mozilla\/4\.0)/g;
  const header = req.headers["user-agent"];
  const isLegacyBrowser = header && regex.test(header);

  if (isLegacyBrowser) {
    res.render("browser");
    return;
  }

  next();
}

export function robots(req: Request, res: Response, next: NextFunction): void {
  const regex = /(robots\.txt)/g;
  const content = "User-agent: *\nDisallow: /\n";
  const match = req.url.toLowerCase().match(regex);

  if (match && match.length) {
    res.set("Content-Type", "text/plain");
    res.send(content);
    return;
  }

  next();
}

export function trusted(req: Request, res: Response, next: NextFunction): void {
  const forwarded = req.headers["x-forwarded-for"];
  const ipaddress = Array.isArray(forwarded)
    ? forwarded[0]
    : (forwarded as string | undefined);
  const allowList = config.ALLOW || [];

  if (ipaddress && !allowList.includes(ipaddress)) {
    res.header("Location", config.URL?.BASE || "/");
    res.sendStatus(302);
    return;
  }

  next();
}

export default {
  securityHeaders,
  corsGuard,
  rateLimit,
  sanitizeNoSql,
  sanitizeObject,
  browser,
  robots,
  trusted,
};
