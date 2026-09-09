import crypto from "node:crypto";
import { models } from "../helpers/models";
import * as utils from "../helpers/utils";
import { sendMail } from "../helpers/email";
import config from "../config.json";
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
 * Registers a new user email asynchronously with try/catch.
 */
export async function addUserAsync(email: string): Promise<string> {
  try {
    const usersCol = models.users;
    const existingUser = await usersCol.findOne({ email });
    if (existingUser) {
      return "Email Registered.";
    }

    const code = crypto.randomUUID();
    const query: Partial<User> = {
      email,
      code,
      status: 0,
      createdAt: Date.now(),
    };
    await usersCol.insert(query);

    const site = config.site || "MoNoApps Core";
    const urlBase = config.URL?.BASE || "http://localhost:1344";
    const urlAck = config.URL?.ACK || "/email/confirm/";

    sendMail({
      html: `<div>
        <h1>Welcome to ${site}</h1>
        <p>Open link <a href="${urlBase}${urlAck}${code}">Confirm Email</a> or use this one: ${urlBase}${urlAck}${code}</p>
      </div>`,
      text: "Email Confirmation",
      subject: `Registry - ${site}`,
      email,
      name: email,
      tags: ["register"],
    });

    return "Email Registered.";
  } catch (error) {
    throw new Error(`Email Registry Error: ${(error as Error).message}`);
  }
}

export function addUser(
  email: string,
  cb?: (err: string | boolean | null, success?: string) => void,
): Promise<string> {
  const p = addUserAsync(email);
  if (cb) {
    p.then((msg) => cb(false, msg)).catch(() => cb("Email Registry Error."));
  }
  return p;
}

/**
 * Confirms user email registration with a verification code.
 */
export async function confirmEmailAsync(code: string): Promise<User> {
  try {
    const usersCol = models.users;
    const user = (await usersCol.findOne({ code })) as unknown as User | null;
    if (!user) {
      throw new Error("User Not Found.");
    }

    const userId = (user._id as any).toString();
    const generatedPassword = crypto.randomUUID();
    const { pwd, text } = utils.createPwd({
      key: userId,
      text: generatedPassword,
    });

    const updateDoc: Partial<User> = {
      password: pwd,
      status: 1,
      date: Date.now(),
      gravatar: getGravatarURL(user.email),
    };

    const acknowledged = await usersCol.updateById(
      user._id as any,
      {
        $set: updateDoc,
        $unset: { code: "" },
      } as any,
    );

    if (!acknowledged) {
      throw new Error("Confirmation Not Found.");
    }

    const site = config.site || "MoNoApps Core";
    sendMail({
      html: `<div>
        <h1>Access Confirm</h1>
        <p>First time access, use next password:</p>
        <p>${text}</p>
      </div>`,
      text: "Access Confirm",
      subject: `First Time Access - ${site}`,
      email: user.email,
      name: user.email,
      tags: ["autopwd"],
    });

    return { ...user, ...updateDoc } as unknown as User;
  } catch (error) {
    throw error;
  }
}

export function confirmEmail(
  code: string,
  cb?: (err: string | boolean | null, user?: User) => void,
): Promise<User> {
  const p = confirmEmailAsync(code);
  if (cb) {
    p.then((user) => cb(false, user)).catch((err) =>
      cb(err.message || "Email Registry Error."),
    );
  }
  return p;
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

    if (isValid) {
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
  addUser,
  addUserAsync,
  confirmEmail,
  confirmEmailAsync,
  isPwdOK,
  isPwdOKAsync,
  getGravatarURL,
};
