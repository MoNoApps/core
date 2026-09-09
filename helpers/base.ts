import {
  ObjectId,
  type Filter,
  type UpdateFilter,
  type Document,
} from "mongodb";
import { ModernModel } from "./db";

const DEFAULT_SIZE = 100;
const DEFAULT_SORT: Record<string, 1 | -1> = { createdAt: 1 };

export type BaseCallback<T = any> = (
  err: Error | null | boolean | string,
  res?: T,
  extra?: unknown,
) => void;

export class CBase<T extends Document = Document> {
  public model: ModernModel<T> | any;
  public size: number;
  public sort: Record<string, 1 | -1>;

  constructor(
    model: ModernModel<T> | any,
    size: number = DEFAULT_SIZE,
    sort: Record<string, 1 | -1> = DEFAULT_SORT,
  ) {
    this.model = model;
    this.size = size;
    this.sort = sort;
  }

  async list(query: Filter<T> = {}): Promise<T[]> {
    try {
      if (this.model && typeof this.model.find === "function") {
        return await this.model.find(query, {
          limit: this.size,
          sort: this.sort,
        });
      }
      return await new Promise<T[]>((resolve, reject) => {
        this.model.Find(
          query,
          (err: any, res: T[]) => (err ? reject(err) : resolve(res)),
          {},
          {},
          this.size,
          this.sort,
        );
      });
    } catch (error) {
      throw new Error(`CBase.list failed: ${(error as Error).message}`);
    }
  }

  List(query: Filter<T>, callback?: BaseCallback<T[]>): Promise<T[]> {
    const p = this.list(query);
    if (callback) {
      p.then((res) => callback(null, res)).catch((err) => callback(err));
    }
    return p;
  }

  async getOne(query: Filter<T>): Promise<T | null> {
    try {
      if (this.model && typeof this.model.findOne === "function") {
        return await this.model.findOne(query);
      }
      return await new Promise<T | null>((resolve, reject) => {
        this.model.FindOne(query, (err: any, res: T | null) =>
          err ? reject(err) : resolve(res),
        );
      });
    } catch (error) {
      throw new Error(`CBase.getOne failed: ${(error as Error).message}`);
    }
  }

  GetOne(
    query: Filter<T>,
    callback?: BaseCallback<T | null>,
  ): Promise<T | null> {
    const p = this.getOne(query);
    if (callback) {
      p.then((res) => callback(null, res)).catch((err) => callback(err));
    }
    return p;
  }

  async findById(id: string | ObjectId): Promise<T | null> {
    try {
      if (this.model && typeof this.model.findById === "function") {
        return await this.model.findById(id);
      }
      return await new Promise<T | null>((resolve, reject) => {
        this.model.FindByObjectId(
          this._buildQueryByIndex(id),
          "_id",
          (err: any, res: T | null) => (err ? reject(err) : resolve(res)),
        );
      });
    } catch (error) {
      throw new Error(`CBase.findById failed: ${(error as Error).message}`);
    }
  }

  FindById(
    id: string | ObjectId,
    callback?: BaseCallback<T | null>,
  ): Promise<T | null> {
    const p = this.findById(id);
    if (callback) {
      p.then((res) => callback(null, res)).catch((err) => callback(err));
    }
    return p;
  }

  async create(query: Partial<T>): Promise<T> {
    try {
      if (this.model && typeof this.model.insert === "function") {
        return await this.model.insert(query);
      }
      return await new Promise<T>((resolve, reject) => {
        this.model.Insert(query, (err: any, res: T) =>
          err ? reject(err) : resolve(res),
        );
      });
    } catch (error) {
      throw new Error(`CBase.create failed: ${(error as Error).message}`);
    }
  }

  Create(query: Partial<T>, callback?: BaseCallback<T>): Promise<T> {
    const p = this.create(query);
    if (callback) {
      p.then((res) => callback(null, res)).catch((err) => callback(err));
    }
    return p;
  }

  async update(
    query: Filter<T>,
    doc: UpdateFilter<T> | Partial<T>,
  ): Promise<boolean> {
    try {
      if (this.model && typeof this.model.update === "function") {
        return await this.model.update(query, doc);
      }
      return await new Promise<boolean>((resolve, reject) => {
        this.model.Update(query, doc, { w: 1 }, (err: any, res: any) =>
          err ? reject(err) : resolve(res),
        );
      });
    } catch (error) {
      throw new Error(`CBase.update failed: ${(error as Error).message}`);
    }
  }

  Update(
    query: Filter<T>,
    doc: UpdateFilter<T> | Partial<T>,
    callback?: BaseCallback<boolean | any>,
  ): Promise<boolean> {
    const p = this.update(query, doc);
    if (callback) {
      p.then((res) => callback(null, res)).catch((err) => callback(err));
    }
    return p;
  }

  async updateById(
    id: string | ObjectId,
    doc: UpdateFilter<T> | Partial<T>,
  ): Promise<boolean> {
    try {
      if (this.model && typeof this.model.updateById === "function") {
        return await this.model.updateById(id, doc);
      }
      return await new Promise<boolean>((resolve, reject) => {
        this.model.UpdateByObjectId(
          this._buildQueryByIndex(id),
          doc,
          "_id",
          (err: any, res: any) => (err ? reject(err) : resolve(res)),
        );
      });
    } catch (error) {
      throw new Error(`CBase.updateById failed: ${(error as Error).message}`);
    }
  }

  UpdateById(
    id: string | ObjectId,
    doc: UpdateFilter<T> | Partial<T>,
    callback?: BaseCallback<boolean | any>,
  ): Promise<boolean> {
    const p = this.updateById(id, doc);
    if (callback) {
      p.then((res) => callback(null, res)).catch((err) => callback(err));
    }
    return p;
  }

  async updateByIdAndQuery(
    id: string | ObjectId,
    doc: UpdateFilter<T> | Partial<T>,
    query: Filter<T> = {},
  ): Promise<boolean> {
    try {
      const _id =
        typeof id === "string" && ObjectId.isValid(id)
          ? new ObjectId(id)
          : (id as unknown as ObjectId);
      const combinedFilter = { ...query, _id } as unknown as Filter<T>;
      return await this.update(combinedFilter, doc);
    } catch (error) {
      throw new Error(
        `CBase.updateByIdAndQuery failed: ${(error as Error).message}`,
      );
    }
  }

  UpdateByIdAndQuery(
    id: string | ObjectId,
    doc: UpdateFilter<T> | Partial<T>,
    query: Filter<T>,
    callback?: BaseCallback<boolean | any>,
  ): Promise<boolean> {
    const p = this.updateByIdAndQuery(id, doc, query);
    if (callback) {
      p.then((res) => callback(null, res)).catch((err) => callback(err));
    }
    return p;
  }

  async delete(query: Filter<T>): Promise<boolean> {
    try {
      if (this.model && typeof this.model.delete === "function") {
        return await this.model.delete(query);
      }
      return await new Promise<boolean>((resolve, reject) => {
        this.model.Remove(query, (err: any, res: any) =>
          err ? reject(err) : resolve(res),
        );
      });
    } catch (error) {
      throw new Error(`CBase.delete failed: ${(error as Error).message}`);
    }
  }

  Delete(
    query: Filter<T>,
    callback?: BaseCallback<boolean | any>,
  ): Promise<boolean> {
    const p = this.delete(query);
    if (callback) {
      p.then((res) => callback(null, res)).catch((err) => callback(err));
    }
    return p;
  }

  async deleteById(id: string | ObjectId): Promise<boolean> {
    try {
      if (this.model && typeof this.model.deleteById === "function") {
        return await this.model.deleteById(id);
      }
      return await new Promise<boolean>((resolve, reject) => {
        this.model.RemoveByObjectId(
          this._buildQueryByIndex(id),
          "_id",
          (err: any, res: any) => (err ? reject(err) : resolve(res)),
        );
      });
    } catch (error) {
      throw new Error(`CBase.deleteById failed: ${(error as Error).message}`);
    }
  }

  DeleteById(
    id: string | ObjectId,
    callback?: BaseCallback<boolean | any>,
  ): Promise<boolean> {
    const p = this.deleteById(id);
    if (callback) {
      p.then((res) => callback(null, res)).catch((err) => callback(err));
    }
    return p;
  }

  async incById(
    id: string | ObjectId,
    key: string,
    qty: number,
  ): Promise<boolean> {
    try {
      const doc: any = { $inc: { [key]: qty } };
      return await this.updateById(id, doc);
    } catch (error) {
      throw new Error(`CBase.incById failed: ${(error as Error).message}`);
    }
  }

  IncById(
    id: string | ObjectId,
    key: string,
    qty: number,
    callback?: BaseCallback<boolean | any>,
  ): Promise<boolean> {
    const p = this.incById(id, key, qty);
    if (callback) {
      p.then((res) => callback(null, res)).catch((err) => callback(err));
    }
    return p;
  }

  async aggregate(pipeline: Document[]): Promise<Document[]> {
    try {
      if (this.model && typeof this.model.aggregate === "function") {
        return await this.model.aggregate(pipeline);
      }
      return await new Promise<Document[]>((resolve, reject) => {
        this.model.Aggregate(pipeline, (err: any, res: Document[]) =>
          err ? reject(err) : resolve(res),
        );
      });
    } catch (error) {
      throw new Error(`CBase.aggregate failed: ${(error as Error).message}`);
    }
  }

  Aggregate(
    query: Document[],
    callback?: BaseCallback<Document[]>,
  ): Promise<Document[]> {
    const p = this.aggregate(query);
    if (callback) {
      p.then((res) => callback(null, res)).catch((err) => callback(err));
    }
    return p;
  }

  private _buildQueryByIndex(
    id: string | ObjectId,
    query: Record<string, any> = {},
  ): Record<string, any> {
    return Object.assign({}, query, { _id: id });
  }
}

export default CBase;
