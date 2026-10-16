import { isPwdOKAsync, getGravatarURL } from "./auth";
import { controllers } from "./controllers";
import { review, response as managerResponse } from "../helpers/manager";

export function ping(_req: any, res: any): void {
  res.status(200).send("OK");
}

export async function login(req: any, res: any): Promise<void> {
  try {
    if (!req.body || !req.body.email || !req.body.password) {
      res.status(401).json({ error: "Email and password are required" });
      return;
    }

    const { isValid, token, gravatar } = await isPwdOKAsync(
      req.body.email,
      req.body.password,
    );
    if (isValid && token) {
      const tokenAny = token as any;
      const tokenId =
        tokenAny._id || (tokenAny.ops ? tokenAny.ops[0]._id : tokenAny[0]?._id);
      res.status(200).json({
        token: tokenId,
        gravatar: gravatar || getGravatarURL(req.body.email),
      });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    console.error("[commons.login] Error:", error);
    res.status(401).json({ error: "Authentication failed" });
  }
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

export default {
  ping,
  login,
  properties,
};
