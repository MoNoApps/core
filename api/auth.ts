import crypto from "node:crypto";
import { models } from "../helpers/models";
import * as utils from "../helpers/utils";
import type { User, AuthToken } from "../src/types/index";

export function getGravatarURL(email: string): string {
  const size = 50;
  const hash = crypto
    .createHash("md5")
    .update(email.trim().toLowerCase())
    .digest("hex");
  return `https://secure.gravatar.com/avatar/${hash}.jpg?size=${size}`;
}

/**
 * Verifies user credentials using try/catch controlled promise.
 */
export async function isPwdOKAsync(
  email: string,
  text: string,
): Promise<{ isValid: boolean; token?: AuthToken; gravatar?: string }> {
  try {
    const usersCol = models.users;
    const user = (await usersCol.findOne({ email })) as unknown as User | null;

    if (!user || !user.password) {
      return { isValid: false };
    }

    const userId = (user._id as any).toString();
    const options = { key: userId, text };
    const isValid = utils.comparePwd(options, user.password as utils.PwdHash);

    if (isValid && user) {
      const token = await utils.createTokenAsync(user);
      return {
        isValid: true,
        token,
        gravatar: (user.gravatar as string) || getGravatarURL(user.email),
      };
    }

    return { isValid: false };
  } catch (error) {
    console.error("[isPwdOKAsync] Error validating password:", error);
    return { isValid: false };
  }
}

export function isPwdOK(
  email: string,
  text: string,
  cb?: (
    err: string | boolean | null,
    isValid?: boolean,
    token?: any,
    gravatar?: string,
  ) => void,
): Promise<{ isValid: boolean; token?: AuthToken; gravatar?: string }> {
  const p = isPwdOKAsync(email, text);
  if (cb) {
    p.then(({ isValid, token, gravatar }) => {
      if (isValid) {
        cb(null, true, token, gravatar);
      } else {
        cb("Invalid Auth", false);
      }
    }).catch((err) => cb(err?.message || "Invalid Auth", false));
  }
  return p;
}

export default {
  isPwdOK,
  isPwdOKAsync,
  getGravatarURL,
};
