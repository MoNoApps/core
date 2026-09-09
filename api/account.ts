import * as utils from "../helpers/utils";
import { controllers } from "./controllers";
import { review, response as managerResponse } from "../helpers/manager";
import config from "../config.json";

const guestConfig = config.guest || {
  email: "guest@monoapps.co",
  text: "guest1234",
  admin: false,
  status: 1,
  enabled: true,
};

function _guest(data: any): any {
  if (data.email === guestConfig.email) {
    data.err = false;
    data.rsp = { message: "Update is disabled" };
    return data;
  }
  return false;
}

export async function find(req: any, res: any): Promise<void> {
  try {
    const opt = await review({ req, res });
    if (!opt) return;

    const rsp = { ...opt.user };
    delete rsp.password;
    managerResponse({ req, res, rsp });
  } catch (err) {
    managerResponse({ req, res, err });
  }
}

export async function update(req: any, res: any): Promise<void> {
  try {
    const opt = await review({ req, res });
    if (!opt) return;

    const restricted = _guest({ req, res, email: opt.user?.email });
    if (restricted) {
      return managerResponse(restricted);
    }

    const userId = (opt.user?._id as any).toString();
    const rsp = await controllers.users.updateById(userId, {
      $set: { name: req.body?.name },
    });
    managerResponse({ req, res, rsp });
  } catch (err) {
    managerResponse({ req, res, err });
  }
}

export async function security(req: any, res: any): Promise<void> {
  try {
    const opt = await review({ req, res });
    if (!opt) return;

    const restricted = _guest({ req, res, email: opt.user?.email });
    if (restricted) {
      return managerResponse(restricted);
    }

    const { password, newPwd, again } = req.body || {};
    if (!password || !newPwd || !again || newPwd !== again) {
      res.status(401).json({ error: "Invalid password parameters" });
      return;
    }

    const userId = (opt.user?._id as any).toString();
    const query = { key: userId, text: password };

    const isOK = utils.comparePwd(query, opt.user?.password as utils.PwdHash);
    if (!isOK) {
      res.status(401).json({ error: "Current password does not match" });
      return;
    }

    query.text = newPwd;
    const { pwd } = utils.createPwd(query);
    const rsp = await controllers.users.updateById(userId, {
      $set: { password: pwd },
    });
    managerResponse({ req, res, rsp });
  } catch (err) {
    managerResponse({ req, res, err });
  }
}

export function guest(_req: any, res: any): void {
  try {
    if (guestConfig.enabled) {
      res
        .status(200)
        .json({ email: guestConfig.email, password: guestConfig.text });
    } else {
      res.status(200).json({});
    }
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

export default {
  find,
  guest,
  update,
  security,
};
