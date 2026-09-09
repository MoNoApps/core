import {
  MongoClient,
  Db,
  Collection,
  ObjectId,
  type Document,
  type Filter,
  type UpdateFilter,
  type OptionalUnlessRequiredId,
} from "mongodb";
import config from "../config.json";

const uri =
  process.env.MONGODB_URI ||
  config.dburl ||
  "mongodb://127.0.0.1:27017/coreapp";
let client: MongoClient | null = null;
let dbInstance: Db | null = null;

export async function getDb(): Promise<Db> {
  if (dbInstance) {
    return dbInstance;
  }
  if (!client) {
    client = new MongoClient(uri, {
      maxPoolSize: 50,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000,
    });
    await client.connect();
  }
  dbInstance = client.db();
  return dbInstance;
}

export async function getCollection<T extends Document = Document>(
  name: string,
): Promise<Collection<T>> {
  const db = await getDb();
  return db.collection<T>(name);
}

export class ModernModel<T extends Document = Document> {
  public name: string;

  constructor(name: string) {
    this.name = name;
  }

  async find(
    filter: Filter<T> = {},
    options: {
      limit?: number;
      sort?: Record<string, 1 | -1>;
      skip?: number;
    } = {},
  ): Promise<T[]> {
    const col = await getCollection<T>(this.name);
    let cursor = col.find(filter);
    if (options.sort) cursor = cursor.sort(options.sort);
    if (options.skip) cursor = cursor.skip(options.skip);
    if (options.limit) cursor = cursor.limit(options.limit);
    return cursor.toArray() as unknown as Promise<T[]>;
  }

  async findOne(filter: Filter<T>): Promise<T | null> {
    const col = await getCollection<T>(this.name);
    return col.findOne(filter) as Promise<T | null>;
  }

  async findById(id: string | ObjectId): Promise<T | null> {
    const _id =
      typeof id === "string" && ObjectId.isValid(id)
        ? new ObjectId(id)
        : (id as unknown as ObjectId);
    const col = await getCollection<T>(this.name);
    return col.findOne({ _id } as unknown as Filter<T>) as Promise<T | null>;
  }

  async insert(doc: Partial<T>): Promise<T> {
    const col = await getCollection<T>(this.name);
    const now = new Date();
    const payload = {
      ...doc,
      createdAt: (doc as Record<string, unknown>).createdAt || now,
      updatedAt: now,
    } as unknown as OptionalUnlessRequiredId<T>;
    const res = await col.insertOne(payload);
    return { ...doc, _id: res.insertedId } as unknown as T;
  }

  async update(
    filter: Filter<T>,
    updateDoc: UpdateFilter<T> | Partial<T>,
  ): Promise<boolean> {
    const col = await getCollection<T>(this.name);
    const res = await col.updateMany(filter, updateDoc as UpdateFilter<T>);
    return res.acknowledged;
  }

  async updateById(
    id: string | ObjectId,
    updateDoc: UpdateFilter<T> | Partial<T>,
  ): Promise<boolean> {
    const _id =
      typeof id === "string" && ObjectId.isValid(id)
        ? new ObjectId(id)
        : (id as unknown as ObjectId);
    const col = await getCollection<T>(this.name);
    const update =
      (updateDoc as Record<string, unknown>).$set ||
      (updateDoc as Record<string, unknown>).$inc
        ? updateDoc
        : { $set: updateDoc };
    const res = await col.updateOne(
      { _id } as unknown as Filter<T>,
      update as UpdateFilter<T>,
    );
    return res.acknowledged;
  }

  async delete(filter: Filter<T>): Promise<boolean> {
    const col = await getCollection<T>(this.name);
    const res = await col.deleteMany(filter);
    return res.acknowledged;
  }

  async deleteById(id: string | ObjectId): Promise<boolean> {
    const _id =
      typeof id === "string" && ObjectId.isValid(id)
        ? new ObjectId(id)
        : (id as unknown as ObjectId);
    const col = await getCollection<T>(this.name);
    const res = await col.deleteOne({ _id } as unknown as Filter<T>);
    return res.acknowledged;
  }
}

export default {
  getDb,
  getCollection,
  ModernModel,
};
