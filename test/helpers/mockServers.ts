import net from "node:net";
import { BSON, ObjectId } from "bson";
import type { MockServerHandle } from "../types";

/**
 * Serializes standard JavaScript values and objects into Redis RESP / RESP3 protocol strings.
 */
function encodeResp(val: unknown): string {
  if (typeof val === "string") {
    return `$${Buffer.byteLength(val)}\r\n${val}\r\n`;
  }
  if (typeof val === "number") {
    return `:${val}\r\n`;
  }
  if (Array.isArray(val)) {
    return `*${val.length}\r\n` + val.map(encodeResp).join("");
  }
  if (typeof val === "object" && val !== null) {
    const entries = Object.entries(val);
    let out = `%${entries.length}\r\n`;
    for (const [k, v] of entries) {
      out += encodeResp(k) + encodeResp(v);
    }
    return out;
  }
  return "+OK\r\n";
}

/**
 * Creates an in-process mock RESP server for Redis on port 6379 (or specified port)
 * if no real Redis instance is currently listening.
 */
export async function startMockRedis(
  port = 6379,
  host = "127.0.0.1",
): Promise<MockServerHandle> {
  const subscribers = new Map<string, Set<net.Socket>>();
  const sockets = new Set<net.Socket>();

  // Human-readable Redis server handshake metadata (RESP3 HELLO response)
  const redisServerInfo = {
    server: "redis",
    version: "7.2.0",
    proto: 3,
    id: 1,
    mode: "standalone",
    role: "master",
    modules: [],
  };
  const helloResp = encodeResp(redisServerInfo);

  const server = net.createServer((socket) => {
    sockets.add(socket);
    socket.on("error", () => {});
    socket.on("close", () => {
      sockets.delete(socket);
      for (const set of subscribers.values()) {
        set.delete(socket);
      }
    });

    socket.on("data", (data) => {
      const str = data.toString();
      if (/hello/i.test(str)) {
        socket.write(helloResp + "+OK\r\n+OK\r\n+OK\r\n");
      } else if (/ping/i.test(str)) {
        socket.write("+PONG\r\n");
      } else if (/unsubscribe/i.test(str)) {
        const match = str.match(/unsubscribe\r\n\$(\d+)\r\n([^\r\n]+)/i);
        const ch = match ? match[2] : "ch";
        if (subscribers.has(ch)) {
          subscribers.get(ch)!.delete(socket);
        }
        socket.write(
          `>3\r\n$11\r\nunsubscribe\r\n$${ch.length}\r\n${ch}\r\n:0\r\n`,
        );
      } else if (/subscribe/i.test(str)) {
        const match = str.match(/subscribe\r\n\$(\d+)\r\n([^\r\n]+)/i);
        const ch = match ? match[2] : "ch";
        if (!subscribers.has(ch)) {
          subscribers.set(ch, new Set());
        }
        subscribers.get(ch)!.add(socket);
        socket.write(
          `>3\r\n$9\r\nsubscribe\r\n$${ch.length}\r\n${ch}\r\n:1\r\n`,
        );
      } else if (/publish/i.test(str)) {
        const parts = str.split("\r\n");
        const pubIdx = parts.findIndex((p) => /^publish$/i.test(p));
        const ch = parts[pubIdx + 2] || "";
        const msg = parts[pubIdx + 4] || "";
        const subs = subscribers.get(ch) || new Set();
        socket.write(`:${subs.size}\r\n`);
        const msgBuf = Buffer.from(msg);
        for (const subSock of subs) {
          subSock.write(
            `>3\r\n$7\r\nmessage\r\n$${ch.length}\r\n${ch}\r\n$${msgBuf.length}\r\n${msg}\r\n`,
          );
        }
      } else if (/quit/i.test(str)) {
        socket.write("+OK\r\n");
        socket.end();
      }
    });
  });

  return new Promise<MockServerHandle>((resolve) => {
    server.once("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        // Real Redis is already running on this port
        resolve({
          isMock: false,
          close: async () => {},
        });
      } else {
        resolve({
          isMock: false,
          close: async () => {},
        });
      }
    });

    server.listen(port, host, () => {
      resolve({
        isMock: true,
        close: () =>
          new Promise<void>((res) => {
            for (const sock of sockets) {
              sock.destroy();
            }
            server.close(() => res());
          }),
      });
    });
  });
}

function makeOpReply(responseTo: number, doc: Record<string, any>): Buffer {
  const docBuf = Buffer.from(BSON.serialize(doc));
  const totalLen = 16 + 20 + docBuf.length;
  const buf = Buffer.alloc(totalLen);
  buf.writeInt32LE(totalLen, 0);
  buf.writeInt32LE(100, 4);
  buf.writeInt32LE(responseTo, 8);
  buf.writeInt32LE(1, 12); // OP_REPLY
  buf.writeInt32LE(0, 16);
  buf.writeBigInt64LE(0n, 20);
  buf.writeInt32LE(0, 28);
  buf.writeInt32LE(1, 32);
  docBuf.copy(buf, 36);
  return buf;
}

function makeOpMsg(responseTo: number, doc: Record<string, any>): Buffer {
  const docBuf = Buffer.from(BSON.serialize(doc));
  const totalLen = 16 + 4 + 1 + docBuf.length;
  const buf = Buffer.alloc(totalLen);
  buf.writeInt32LE(totalLen, 0);
  buf.writeInt32LE(101, 4);
  buf.writeInt32LE(responseTo, 8);
  buf.writeInt32LE(2013, 12); // OP_MSG
  buf.writeUInt32LE(0, 16);
  buf.writeUInt8(0, 20);
  docBuf.copy(buf, 21);
  return buf;
}

function matchDoc(doc: any, filter: Record<string, any>): boolean {
  for (const [k, v] of Object.entries(filter)) {
    if (k === "_id") {
      if (doc._id?.toString() !== v?.toString()) return false;
    } else if (typeof v === "object" && v !== null) {
      if (JSON.stringify(doc[k]) !== JSON.stringify(v)) return false;
    } else if (doc[k] !== v) {
      return false;
    }
  }
  return true;
}

/**
 * Creates an in-process mock MongoDB OP_MSG/OP_QUERY server on port 27017 (or specified port)
 * if no real MongoDB instance is currently listening.
 */
export async function startMockMongo(
  port = 27017,
  host = "127.0.0.1",
): Promise<MockServerHandle> {
  const collections = new Map<string, any[]>();
  const sockets = new Set<net.Socket>();

  function getCol(name: string): any[] {
    if (!collections.has(name)) collections.set(name, []);
    return collections.get(name)!;
  }

  const server = net.createServer((socket) => {
    sockets.add(socket);
    socket.on("error", () => {});
    socket.on("close", () => {
      sockets.delete(socket);
    });

    let buf = Buffer.alloc(0);
    socket.on("data", (chunk: Buffer | string) => {
      const chunkBuf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      buf = Buffer.concat([buf, chunkBuf]);
      while (buf.length >= 16) {
        const msgLen = buf.readInt32LE(0);
        if (buf.length < msgLen) break;
        const msgBuf = buf.subarray(0, msgLen);
        buf = buf.subarray(msgLen);

        const reqId = msgBuf.readInt32LE(4);
        const opCode = msgBuf.readInt32LE(12);

        if (opCode === 2004) {
          // Legacy OP_QUERY handshake
          socket.write(
            makeOpReply(reqId, {
              ismaster: true,
              maxBsonObjectSize: 16777216,
              maxMessageSizeBytes: 48000000,
              maxWriteBatchSize: 100000,
              localTime: new Date(),
              logicalSessionTimeoutMinutes: 30,
              minWireVersion: 0,
              maxWireVersion: 21,
              readOnly: false,
              ok: 1,
            }),
          );
        } else if (opCode === 2013) {
          // OP_MSG
          const doc = BSON.deserialize(msgBuf.subarray(21)) as any;
          const dbName = doc["$db"] || "coreapp";

          if (doc.ping) {
            socket.write(makeOpMsg(reqId, { ok: 1 }));
          } else if (doc.hello || doc.ismaster) {
            socket.write(
              makeOpMsg(reqId, {
                isWritablePrimary: true,
                maxBsonObjectSize: 16777216,
                maxMessageSizeBytes: 48000000,
                maxWriteBatchSize: 100000,
                logicalSessionTimeoutMinutes: 30,
                minWireVersion: 0,
                maxWireVersion: 21,
                ok: 1,
              }),
            );
          } else if (doc.endSessions) {
            socket.write(makeOpMsg(reqId, { ok: 1 }));
          } else if (doc.insert) {
            const col = getCol(doc.insert);
            const docs = doc.documents || [];
            for (const d of docs) {
              if (!d._id) d._id = new ObjectId();
              col.push({ ...d });
            }
            socket.write(makeOpMsg(reqId, { n: docs.length, ok: 1 }));
          } else if (doc.find) {
            const col = getCol(doc.find);
            const filter = doc.filter || {};
            let matched = col.filter((d) => matchDoc(d, filter));
            if (doc.skip) matched = matched.slice(doc.skip);
            if (doc.limit) matched = matched.slice(0, doc.limit);
            socket.write(
              makeOpMsg(reqId, {
                cursor: {
                  firstBatch: matched,
                  id: 0n,
                  ns: `${dbName}.${doc.find}`,
                },
                ok: 1,
              }),
            );
          } else if (doc.update) {
            const col = getCol(doc.update);
            let nModified = 0;
            for (const u of doc.updates || []) {
              const filter = u.q || {};
              const updateDoc = u.u || {};
              const setDoc = updateDoc["$set"] || updateDoc;
              for (const item of col) {
                if (matchDoc(item, filter)) {
                  Object.assign(item, setDoc);
                  nModified++;
                  if (!u.multi) break;
                }
              }
            }
            socket.write(makeOpMsg(reqId, { n: nModified, nModified, ok: 1 }));
          } else if (doc.delete) {
            const col = getCol(doc.delete);
            let deletedCount = 0;
            for (const del of doc.deletes || []) {
              const filter = del.q || {};
              const limit = del.limit || 0;
              const remaining: any[] = [];
              for (const item of col) {
                if (
                  (limit === 0 || deletedCount < limit) &&
                  matchDoc(item, filter)
                ) {
                  deletedCount++;
                } else {
                  remaining.push(item);
                }
              }
              collections.set(doc.delete, remaining);
            }
            socket.write(makeOpMsg(reqId, { n: deletedCount, ok: 1 }));
          } else if (doc.drop) {
            collections.delete(doc.drop);
            socket.write(makeOpMsg(reqId, { ok: 1 }));
          } else if (doc.createIndexes) {
            socket.write(makeOpMsg(reqId, { numIndexesAfter: 2, ok: 1 }));
          } else {
            socket.write(makeOpMsg(reqId, { ok: 1 }));
          }
        }
      }
    });
  });

  return new Promise<MockServerHandle>((resolve) => {
    server.once("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        resolve({
          isMock: false,
          close: async () => {},
        });
      } else {
        resolve({
          isMock: false,
          close: async () => {},
        });
      }
    });

    server.listen(port, host, () => {
      resolve({
        isMock: true,
        close: () =>
          new Promise<void>((res) => {
            for (const sock of sockets) {
              sock.destroy();
            }
            server.close(() => res());
          }),
      });
    });
  });
}
