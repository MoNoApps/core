import { createClient, type RedisClientType } from "redis";
import config from "../config.json";

const redisUrl =
  process.env.REDIS_URL || (config as any).redis || "redis://127.0.0.1:6379";

const socketOptions = {
  reconnectStrategy: (retries: number) => {
    if (process.env.NODE_ENV === "test" || retries > 2) {
      return false;
    }
    return Math.min(retries * 50, 500);
  },
};

export const pub = createClient({ url: redisUrl, socket: socketOptions });
export const sub = createClient({ url: redisUrl, socket: socketOptions });

if (process.env.NODE_ENV !== "test") {
  pub.on("error", (err) => console.error("Redis Pub Client Error:", err));
  sub.on("error", (err) => console.error("Redis Sub Client Error:", err));
} else {
  pub.on("error", () => {});
  sub.on("error", () => {});
}

export async function connectRedis(): Promise<{
  pub: typeof pub;
  sub: typeof sub;
}> {
  if (!pub.isOpen) {
    await pub.connect();
  }
  if (!sub.isOpen) {
    await sub.connect();
  }
  return { pub, sub };
}

export async function closeRedis(): Promise<void> {
  try {
    if (pub.isOpen) {
      await pub.quit();
    }
  } catch {
    try {
      await pub.disconnect();
    } catch {}
  }
  try {
    if (sub.isOpen) {
      await sub.quit();
    }
  } catch {
    try {
      await sub.disconnect();
    } catch {}
  }
}

export default {
  pub,
  sub,
  connectRedis,
  closeRedis,
};
