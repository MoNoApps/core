import { createClient, type RedisClientType } from "redis";
import config from "../config.json";

const redisUrl =
  process.env.REDIS_URL || (config as any).redis || "redis://127.0.0.1:6379";

export const pub = createClient({ url: redisUrl });
export const sub = createClient({ url: redisUrl });

pub.on("error", (err) => console.error("Redis Pub Client Error:", err));
sub.on("error", (err) => console.error("Redis Sub Client Error:", err));

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

export default {
  pub,
  sub,
  connectRedis,
};
