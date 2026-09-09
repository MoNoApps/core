import { pub, connectRedis } from "../helpers/ps";
import { sio } from "../web/routes";
import config from "../config.json";
import * as events from "./events";

const site = config.site || "MoNoApps";

export async function current(): Promise<{ users: number }> {
  try {
    const count = await pub.get(`${site}::users`);
    return { users: count ? parseInt(count, 10) : 0 };
  } catch (err) {
    return { users: 0 };
  }
}

export async function incUsers(): Promise<void> {
  try {
    await pub.incr(`${site}::users`);
  } catch (err) {
    // Ignore if Redis is not active
  }
}

export async function resetUsersCount(): Promise<void> {
  try {
    await pub.set(`${site}::users`, "0");
  } catch (err) {
    // Ignore if Redis is not active
  }
}

export async function disconnect(): Promise<void> {
  try {
    await pub.decr(`${site}::users`);
  } catch (err) {
    // Ignore if Redis is not active
  }
}

export function listen(cb?: () => void): void {
  connectRedis()
    .then(() => resetUsersCount())
    .catch((err) =>
      console.warn("[sio] Redis connection warning:", err.message),
    );

  sio.on("connection", (socket: any) => {
    incUsers();

    function identify(token: string) {
      socket.token = token;
    }

    function getUsers() {
      events.users(socket, (_err, usersList) =>
        socket.emit("users", usersList),
      );
    }

    function getRoles() {
      events.roles(socket, (_err, rolesList) =>
        socket.emit("roles", rolesList),
      );
    }

    socket.on("getRoles", getRoles);
    socket.on("getUsers", getUsers);
    socket.on("identify", identify);
    socket.on("disconnect", disconnect);

    current().then((curr) => socket.emit("current", curr));
  });

  if (cb) cb();
}

export default {
  listen,
  current,
  incUsers,
  resetUsersCount,
  disconnect,
};
