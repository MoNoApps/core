import { createClient } from "redis";
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
      if ((pub as any).isReady) {
        await Promise.race([
          pub.quit(),
          new Promise<void>((_, reject) =>
            setTimeout(() => reject(new Error("quit timeout")), 500),
          ),
        ]);
      } else {
        await pub.disconnect();
      }
    }
  } catch {
    try {
      await pub.disconnect();
    } catch {}
  }
  try {
    if (sub.isOpen) {
      if ((sub as any).isReady) {
        await Promise.race([
          sub.quit(),
          new Promise<void>((_, reject) =>
            setTimeout(() => reject(new Error("quit timeout")), 500),
          ),
        ]);
      } else {
        await sub.disconnect();
      }
    }
  } catch {
    try {
      await sub.disconnect();
    } catch {}
  }
}

export interface ResourceChangeEvent {
  resource: string;
  action: "create" | "update" | "delete";
  id?: string;
  userId?: string;
  timestamp: number;
}

export async function publishChange(
  event: ResourceChangeEvent,
): Promise<boolean> {
  try {
    if (!pub.isOpen) {
      await pub.connect();
    }
    const channel = `${config.site || "Core"}::events`;
    await pub.publish(channel, JSON.stringify(event));
    return true;
  } catch (err: any) {
    if (process.env.NODE_ENV !== "test" || process.env.DEBUG) {
      console.warn(
        `[Redis Pub/Sub] Failed to publish ${event.resource} change:`,
        err?.message,
      );
    }
    return false;
  }
}

export default {
  pub,
  sub,
  connectRedis,
  closeRedis,
  publishChange,
};
