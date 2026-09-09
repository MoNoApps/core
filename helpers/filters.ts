import { ObjectId } from "mongodb";
import type { User, AuthToken } from "../src/types/index";
import { getCollection } from "./db";

export type Callback<T = unknown> = (
  err: string | boolean | null | Error,
  res?: T,
  extra?: unknown,
) => void;

/**
 * Validates that target[prop] equals expected value.
 */
export function matchFilter<T extends Record<string, unknown>>(
  target: T,
  prop: keyof T,
  value: unknown,
  callback?: Callback,
): boolean {
  const isMatch = target[prop] === value;
  if (callback) {
    if (isMatch) callback(false);
    else callback("Value does not match.");
  }
  return isMatch;
}

/**
 * Validates that all properties in target are allowed by schema.
 * Throws an Error if property is disallowed.
 */
export function validateSchema(
  target: Record<string, unknown>,
  schema: Record<string, boolean | number>,
): void {
  for (const p of Object.keys(target)) {
    if (!schema[p]) {
      throw new Error(`Property ${p} in target not allowed`);
    }
  }
}

/**
 * Schema filter supporting callback and return validation.
 */
export function schemaFilter(
  target: Record<string, unknown>,
  schema: Record<string, boolean | number>,
  callback?: Callback,
): boolean {
  try {
    validateSchema(target, schema);
    if (callback) callback(false, null);
    return true;
  } catch (error) {
    if (callback) callback((error as Error).message);
    return false;
  }
}

/**
 * Checks if user has admin privileges.
 */
export function checkAdmin(user: User): boolean {
  return Boolean(user.admin);
}

export function adminFilter(
  user: User,
  callback?: (isNotAdmin: boolean) => void,
): boolean {
  const isNotAdmin = !user.admin;
  if (callback) callback(isNotAdmin);
  return !isNotAdmin;
}

/**
 * Strips sensitive or hidden keys from an object or array of objects.
 */
export function cleanObject<T extends Record<string, unknown>>(
  target: T | T[],
  cleaner: Record<string, unknown>,
): T | T[] {
  if (Array.isArray(target)) {
    for (const item of target) {
      if (item && typeof item === "object") {
        for (const c of Object.keys(cleaner)) {
          delete (item as Record<string, unknown>)[c];
        }
      }
    }
  } else if (target && typeof target === "object") {
    for (const r of Object.keys(cleaner)) {
      delete (target as Record<string, unknown>)[r];
    }
  }
  return target;
}

export function cleanerFilter<T extends Record<string, unknown>>(
  target: T | T[],
  cleaner: Record<string, unknown>,
  callback?: (err: boolean, cleaned: T | T[]) => void,
): T | T[] {
  const cleaned = cleanObject(target, cleaner);
  if (callback) callback(false, cleaned);
  return cleaned;
}

/**
 * Authenticates a token ID against MongoDB using try/catch controlled promise.
 */
export async function authenticateToken(
  tokenId: string,
): Promise<{ user: User; token: AuthToken } | null> {
  try {
    if (
      !tokenId ||
      typeof tokenId !== "string" ||
      tokenId.length < 24 ||
      !ObjectId.isValid(tokenId)
    ) {
      return null;
    }
    const tokensCol = await getCollection<AuthToken>("tokens");
    const token = await tokensCol.findOne({
      _id: new ObjectId(tokenId),
    } as any);
    if (!token) return null;

    const usersCol = await getCollection<User>("users");
    const userId =
      typeof token.user === "string" && ObjectId.isValid(token.user)
        ? new ObjectId(token.user)
        : (token.user as ObjectId);
    const user = await usersCol.findOne({ _id: userId } as any);
    if (!user) return null;

    return { user, token };
  } catch (error) {
    console.error("[authenticateToken] Error verifying token:", error);
    return null;
  }
}

/**
 * Validates request authentication token (compatible with Restify/Express response objects).
 */
export async function authFilter(
  res: any,
  tokenId: string,
  callback?: (err: any, user?: User, token?: AuthToken) => void,
): Promise<{ user: User; token: AuthToken } | null> {
  try {
    if (!tokenId || typeof tokenId !== "string" || tokenId.length < 24) {
      res.send(401);
      return null;
    }
    const result = await authenticateToken(tokenId);
    if (!result) {
      res.send(401);
      return null;
    }
    if (callback) callback(null, result.user, result.token);
    return result;
  } catch (err) {
    console.error(err);
    res.send(401);
    if (callback) callback(err);
    return null;
  }
}

export default {
  matchFilter,
  validateSchema,
  schemaFilter,
  checkAdmin,
  adminFilter,
  cleanObject,
  cleanerFilter,
  authenticateToken,
  authFilter,
};
