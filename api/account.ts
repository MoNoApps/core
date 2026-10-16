import * as utils from "../helpers/utils";
import { controllers } from "./controllers";
import { review, response as managerResponse } from "../helpers/manager";

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

export default {
  find,
  update,
  security,
};
