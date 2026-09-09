import { review, response as managerResponse } from "./manager";
import type { CBase } from "./base";

export interface ZappyProps {
  controller: CBase | any;
  schema?: Record<string, boolean | number>;
  admin?: boolean;
  clean?: Record<string, unknown>;
}

export class Zappy {
  public cx: CBase | any;
  public sc?: Record<string, boolean | number>;
  public mg?: boolean;
  public cl?: Record<string, unknown>;

  constructor(props: ZappyProps) {
    this.cx = props.controller;
    this.sc = props.schema;
    this.mg = props.admin;
    this.cl = props.clean;
  }

  async Get(req: any, res: any): Promise<void> {
    try {
      const ge = { req, res, zap: this, admin: this.mg };
      const cl = this.cl;
      const opt = await review(ge);
      if (!opt) return;

      const rsp = await opt.zap.cx.list({});
      managerResponse({ req, res, rsp, clean: cl });
    } catch (err) {
      managerResponse({ req, res, err, clean: this.cl });
    }
  }

  async GetOne(req: any, res: any): Promise<void> {
    try {
      const go = { req, res, zap: this, admin: false };
      const opt = await review(go);
      if (!opt) return;

      const rsp = await opt.zap.cx.findById(req.params.id);
      managerResponse({ req, res, rsp });
    } catch (err) {
      managerResponse({ req, res, err });
    }
  }

  async Del(req: any, res: any): Promise<void> {
    try {
      const de = { req, res, zap: this, admin: false };
      const opt = await review(de);
      if (!opt) return;

      const rsp = await opt.zap.cx.deleteById(req.params.id);
      managerResponse({ req, res, rsp });
    } catch (err) {
      managerResponse({ req, res, err });
    }
  }

  async Post(req: any, res: any): Promise<void> {
    try {
      const po = { req, res, zap: this, admin: false };
      const opt = await review(po);
      if (!opt) return;

      delete req.params.token;
      req.params.userId = opt.user?._id;
      req.params.createdAt = Date.now();

      const rsp = await opt.zap.cx.create(req.params);
      managerResponse({ req, res, rsp });
    } catch (err) {
      managerResponse({ req, res, err });
    }
  }

  async Put(req: any, res: any): Promise<void> {
    try {
      if (req.body) {
        delete req.body._id;
        delete req.body.token;
        delete req.body.admin;
        delete req.body.userId;
        delete req.body.createdAt;
        delete req.body.updatedAt;
        delete req.body.updatedBy;
      }

      const pu = { req, res, zap: this, admin: false, schema: true };
      const opt = await review(pu);
      if (!opt) return;

      req.params.updatedAt = Date.now();
      req.params.updatedBy = opt.user?._id;

      const rsp = await opt.zap.cx.updateById(req.params.id, {
        $set: req.body,
      });
      managerResponse({ req, res, rsp });
    } catch (err) {
      managerResponse({ req, res, err });
    }
  }
}

export default Zappy;
