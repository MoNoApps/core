import crypto from "node:crypto";
import config from "../config.json";
import { ModernModel } from "./db";
import type { AuthToken, User } from "../src/types/index";

export interface PwdOptions {
  key: string;
  text?: string;
}

export interface PwdHash {
  type: string;
  value: string;
  [key: string]: unknown;
}

const tokensModel = new ModernModel<AuthToken>("tokens");

function deriveKeyAndIv(secret: string): { key: Buffer; iv: Buffer } {
  const key = crypto.createHash("sha256").update(secret).digest();
  const iv = crypto.createHash("md5").update(secret).digest();
  return { key, iv };
}

/**
 * Constant-time string equality check to prevent timing attacks.
 */
export function safeEqual(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function encryptString(text: string, secret: string): string {
  try {
    const { key, iv } = deriveKeyAndIv(secret);
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
  } catch (error) {
    throw new Error(`Encryption failed: ${(error as Error).message}`);
  }
}

export function decryptString(encryptedHex: string, secret: string): string {
  try {
    const { key, iv } = deriveKeyAndIv(secret);
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return "";
  }
}

/**
 * Generates a standard v4 UUID using Node 24 native crypto.randomUUID().
 */
export function createUUID(): string {
  return crypto.randomUUID();
}

/**
 * Creates password hash object using crypto.
 */
export function createPwd(
  options: PwdOptions,
  cb?: (pwd: PwdHash, text: string) => void,
): { pwd: PwdHash; text: string } {
  try {
    const the_text = options.text || crypto.randomUUID();
    const the_pwd: PwdHash = {
      value: encryptString(JSON.stringify(the_text), options.key),
      type: encryptString("object", options.key),
    };
    if (cb) {
      cb(the_pwd, the_text);
    }
    return { pwd: the_pwd, text: the_text };
  } catch (error) {
    throw error;
  }
}

/**
 * Compares plain password with hashed password in constant time.
 */
export function comparePwd(
  options: PwdOptions,
  cur: PwdHash,
  cb?: (isMatch: boolean) => void,
): boolean {
  try {
    if (!cur || !cur.value || !cur.type) {
      if (cb) cb(false);
      return false;
    }
    const { pwd } = createPwd(options);
    const isMatch =
      safeEqual(pwd.value, cur.value) && safeEqual(pwd.type, cur.type);
    if (cb) {
      cb(isMatch);
    }
    return isMatch;
  } catch {
    if (cb) cb(false);
    return false;
  }
}

/**
 * Asynchronously creates an AuthToken document using Promise and try/catch.
 */
export async function createTokenAsync(user: User): Promise<AuthToken> {
  try {
    const token: Partial<AuthToken> = {
      user: user._id as string,
      expires: config.TTL || 86400,
    };
    return await tokensModel.insert(token);
  } catch (error) {
    throw new Error(`Token creation failed: ${(error as Error).message}`);
  }
}

export function createToken(
  user: User,
  cb?: (err: Error | null, rst?: AuthToken | any) => void,
): Promise<AuthToken> {
  const promise = createTokenAsync(user);
  if (cb) {
    promise.then((res) => cb(null, res)).catch((err) => cb(err));
  }
  return promise;
}

/**
 * Revokes a single authentication token by ID.
 */
export async function revokeToken(tokenId: string): Promise<boolean> {
  try {
    const res = await tokensModel.deleteById(tokenId);
    return Boolean(res);
  } catch {
    return false;
  }
}

/**
 * Revokes all active tokens for a specific user.
 */
export async function revokeTokensForUser(userId: string): Promise<boolean> {
  try {
    return await tokensModel.delete({ user: userId });
  } catch {
    return false;
  }
}

export default {
  createUUID,
  createPwd,
  comparePwd,
  createToken,
  createTokenAsync,
  revokeToken,
  revokeTokensForUser,
  safeEqual,
  encryptString,
  decryptString,
};
