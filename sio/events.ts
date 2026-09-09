import { models } from "../helpers/models";
import { review } from "../helpers/manager";
import type { Socket } from "socket.io";

export async function users(
  socket: Socket | any,
  cb: (err: any, rsp?: any) => void,
): Promise<void> {
  try {
    const opt = await review({
      req: { params: { token: socket.token } },
      res: {},
    });
    if (opt) {
      const usersList = await models.users.find({});
      cb(null, usersList);
    } else {
      cb(new Error("Unauthorized"));
    }
  } catch (error) {
    cb(error);
  }
}

export async function roles(
  _socket: Socket | any,
  cb: (err: any, rsp?: any) => void,
): Promise<void> {
  try {
    if (models.roles) {
      const rolesList = await models.roles.find({});
      cb(null, rolesList);
    } else {
      cb(null, []);
    }
  } catch (error) {
    cb(error);
  }
}

export default {
  users,
  roles,
};
