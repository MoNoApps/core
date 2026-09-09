import crypto from "node:crypto";
import config from "../config.json";
import * as utils from "../helpers/utils";
import * as register from "./register";
import { models } from "../helpers/models";
import { controllers } from "./controllers";
import { review, response as managerResponse } from "../helpers/manager";
import { sendMail } from "../helpers/email";

export function ping(_req: any, res: any): void {
  res.status(200).send("OK");
}

export async function login(req: any, res: any): Promise<void> {
  try {
    if (!req.body || !req.body.email || !req.body.password) {
      res.status(401).json({ error: "Email and password are required" });
      return;
    }

    const { isValid, token, gravatar } = await register.isPwdOKAsync(
      req.body.email,
      req.body.password,
    );
    if (isValid && token) {
      const tokenAny = token as any;
      const tokenId =
        tokenAny._id || (tokenAny.ops ? tokenAny.ops[0]._id : tokenAny[0]?._id);
      res.status(200).json({
        token: tokenId,
        gravatar: gravatar || register.getGravatarURL(req.body.email),
      });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    console.error("[commons.login] Error:", error);
    res.status(401).json({ error: "Authentication failed" });
  }
}

export async function signup(req: any, res: any): Promise<void> {
  try {
    const email = req.params?.email || req.body?.email;
    const successMsg = await register.addUserAsync(email);
    res.status(200).send(successMsg);
  } catch (err: any) {
    res.status(401).json({ error: err.message || "Email Registry Error." });
  }
}

export async function confirm(req: any, res: any): Promise<void> {
  try {
    const code = req.params?.code;
    await register.confirmEmailAsync(code);
    res.header("Location", "/registered");
    res.status(302).json({ message: "User Confirmed" });
  } catch (err: any) {
    res.status(401).json({ message: err.message || "Confirmation failed." });
  }
}

export function theme(_req: any, res: any): void {
  res.status(200).json({ theme: config.theme });
}

export async function properties(req: any, res: any): Promise<void> {
  try {
    const opt = await review({ req, res });
    if (!opt) return;

    const rsp: any = await controllers.settings.getOne({
      type: "properties",
    } as any);
    if (!rsp || !rsp.data) {
      return managerResponse({ req, res, rsp: {} });
    }

    const data = { ...rsp.data };
    if (!opt.user?.admin) {
      data.resources = data.user;
    } else {
      data.resources = data.admin;
    }
    delete data.user;
    delete data.admin;

    managerResponse({ req, res, rsp: data });
  } catch (err) {
    res.status(501).send("Internal Error");
  }
}

export async function recover(req: any, res: any): Promise<void> {
  try {
    const email = req.params?.email || req.body?.email;
    const key = crypto.randomUUID();

    await controllers.users.update(
      { email } as any,
      { $set: { recover: key } } as any,
    );

    const urlBase = config.URL?.BASE || "http://localhost:1344";
    const urlRec = config.URL?.REC || "/recover/";

    sendMail({
      html: `<div>
        <h1>Recover password request</h1>
        <p>We have received a request from ${config.site}. In case you have not requested password recovery, you can ignore this email.</p>
        <p>Open link <a href="${urlBase}${urlRec}${key}">Recover Password</a> or use this one: ${urlBase}${urlRec}${key}</p>
      </div>`,
      text: "Recover",
      subject: `Recovery Password Request - ${config.site}`,
      email,
      name: email,
      tags: ["recover"],
    });

    res.status(200).send("OK");
  } catch (err) {
    res.status(200).send("OK");
  }
}

export async function rescue(req: any, res: any): Promise<void> {
  try {
    const code = req.params?.code;
    const user: any = await models.users.findOne({ recover: code } as any);
    if (user) {
      const userId = user._id.toString();
      const newPasswordText = crypto.randomUUID();
      const { pwd, text } = utils.createPwd({
        key: userId,
        text: newPasswordText,
      });

      await models.users.updateById(user._id, {
        $set: { password: pwd, updatedAt: Date.now() },
        $unset: { recover: "" },
      } as any);

      sendMail({
        html: `<div>
          <h1>Password Changed</h1>
          <p>Password has been changed to:</p>
          <p>${text}</p>
        </div>`,
        text: "Password Changed",
        subject: `Password Changed - ${config.site}`,
        email: user.email,
        name: user.email,
        tags: ["chgpwd"],
      });
    }
  } catch (e) {
    console.error("[commons.rescue] Error:", e);
  }

  res.header("Location", "/recover");
  res.status(302).json({ site: config.site });
}

export default {
  ping,
  login,
  theme,
  signup,
  rescue,
  confirm,
  recover,
  properties,
};
