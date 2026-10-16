import { describe, it } from "node:test";
import assert from "node:assert";
import { pub, sub, closeRedis } from "../helpers/ps";

describe("Redis Pub/Sub Client Suite (helpers/ps.ts)", () => {
  it("should evaluate reconnectStrategy properly under various retries and environments", () => {
    const socketOpts = (pub as any).options?.socket;
    assert.ok(socketOpts);
    assert.strictEqual(typeof socketOpts.reconnectStrategy, "function");

    const prevEnv = process.env.NODE_ENV;

    // In test environment, returns false
    process.env.NODE_ENV = "test";
    assert.strictEqual(socketOpts.reconnectStrategy(1), false);

    // In production environment
    process.env.NODE_ENV = "production";
    assert.strictEqual(socketOpts.reconnectStrategy(1), 50);
    assert.strictEqual(socketOpts.reconnectStrategy(2), 100);
    assert.strictEqual(socketOpts.reconnectStrategy(3), false); // retries > 2
    assert.strictEqual(socketOpts.reconnectStrategy(5), false);
    process.env.NODE_ENV = prevEnv;
  });

  it("closeRedis should handle quit errors and fall back to disconnect safely", async () => {
    // Mock open state
    const originalPubIsOpen = pub.isOpen;
    const originalSubIsOpen = sub.isOpen;
    const originalPubQuit = pub.quit;
    const originalSubQuit = sub.quit;
    const originalPubDisconnect = pub.disconnect;
    const originalSubDisconnect = sub.disconnect;

    let pubDisconnected = false;
    let subDisconnected = false;

    Object.defineProperty(pub, "isOpen", { value: true, configurable: true });
    Object.defineProperty(sub, "isOpen", { value: true, configurable: true });

    (pub as any).quit = async () => {
      throw new Error("Quit failed");
    };
    (sub as any).quit = async () => {
      throw new Error("Quit failed");
    };
    (pub as any).disconnect = async () => {
      pubDisconnected = true;
    };
    (sub as any).disconnect = async () => {
      subDisconnected = true;
    };

    await closeRedis();

    assert.strictEqual(pubDisconnected, true);
    assert.strictEqual(subDisconnected, true);

    // Restore
    Object.defineProperty(pub, "isOpen", {
      value: originalPubIsOpen,
      configurable: true,
    });
    Object.defineProperty(sub, "isOpen", {
      value: originalSubIsOpen,
      configurable: true,
    });
    (pub as any).quit = originalPubQuit;
    (sub as any).quit = originalSubQuit;
    (pub as any).disconnect = originalPubDisconnect;
    (sub as any).disconnect = originalSubDisconnect;
  });
});
