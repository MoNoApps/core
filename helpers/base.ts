import {
  ObjectId,
  type Filter,
  type UpdateFilter,
  type Document,
} from "mongodb";

const DEFAULT_SIZE = 100;
const DEFAULT_SORT: Record<string, 1 | -1> = { createdAt: 1 };

export type BaseCallback<T = unknown> = (
  err: Error | null | boolean | string,
  res?: T,
  extra?: unknown,
) => void;

export interface PaginateOptions {
  page?: number;
  limit?: number;
  sort?: Record<string, 1 | -1>;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CursorOptions {
  after?: string;
  limit?: number;
  sort?: Record<string, 1 | -1>;
}

export interface CursorResult<T> {
  data: T[];
  pageInfo: {
    limit: number;
    hasNextPage: boolean;
    endCursor: string | null;
  };
}

type LegacyCallback<R> = (err: Error | null, res: R) => void;

/**
 * Modern promise-based data model contract (implemented by `ModernModel`).
 */
export interface ModernDataModel<T extends Document = Document> {
  find?(
    filter: Filter<T>,
    options?: { limit?: number; sort?: Record<string, 1 | -1>; skip?: number },
  ): Promise<T[]>;
  findOne?(filter: Filter<T>): Promise<T | null>;
  findById?(id: string | ObjectId): Promise<T | null>;
  insert?(doc: Partial<T>): Promise<T>;
  update?(
    filter: Filter<T>,
    doc: UpdateFilter<T> | Partial<T>,
  ): Promise<boolean>;
  updateById?(
    id: string | ObjectId,
    doc: UpdateFilter<T> | Partial<T>,
  ): Promise<boolean>;
  delete?(filter: Filter<T>): Promise<boolean>;
  deleteById?(id: string | ObjectId): Promise<boolean>;
  aggregate?(pipeline: Document[]): Promise<Document[]>;
  count?(filter?: Filter<T>): Promise<number>;
  estimatedCount?(): Promise<number>;
}

/**
 * Legacy callback-based data model contract (pre-MongoDB 9 plugins).
 */
export interface LegacyDataModel<T extends Document = Document> {
  Find?(
    query: Filter<T>,
    callback: LegacyCallback<T[]>,
    fields?: Document,
    options?: Document,
    limit?: number,
    sort?: Record<string, 1 | -1>,
  ): void;
  FindOne?(query: Filter<T>, callback: LegacyCallback<T | null>): void;
  FindByObjectId?(
    query: Document,
    field: string,
    callback: LegacyCallback<T | null>,
  ): void;
  Insert?(doc: Partial<T>, callback: LegacyCallback<T>): void;
  Update?(
    query: Filter<T>,
    doc: UpdateFilter<T> | Partial<T>,
    options: Document,
    callback: LegacyCallback<boolean>,
  ): void;
  UpdateByObjectId?(
    query: Document,
    doc: UpdateFilter<T> | Partial<T>,
    field: string,
    callback: LegacyCallback<boolean>,
  ): void;
  Remove?(query: Filter<T>, callback: LegacyCallback<boolean>): void;
  RemoveByObjectId?(
    query: Document,
    field: string,
    callback: LegacyCallback<boolean>,
  ): void;
  Aggregate?(pipeline: Document[], callback: LegacyCallback<Document[]>): void;
}

/**
 * Any model accepted by `BaseController`: modern, legacy, or a mix of both.
 */
export type DataModel<T extends Document = Document> = ModernDataModel<T> &
  LegacyDataModel<T>;

/**
 * Generic asynchronous CRUD controller wrapping a `DataModel`.
 * Exposes promise-based methods (`list`, `create`, ...) plus legacy
 * callback-style aliases (`List`, `Create`, ...).
 */
export class BaseController<T extends Document = Document> {
  constructor(
    public model: DataModel<T>,
    public size: number = DEFAULT_SIZE,
    public sort: Record<string, 1 | -1> = DEFAULT_SORT,
  ) {}

  async list(
    query: Filter<T> = {},
    options: {
      limit?: number;
      sort?: Record<string, 1 | -1>;
      skip?: number;
    } = {},
  ): Promise<T[]> {
    try {
      const limit = options.limit !== undefined ? options.limit : this.size;
      const sort = options.sort || this.sort;
      const skip = options.skip !== undefined ? options.skip : 0;

      if (this.model && typeof this.model.find === "function") {
        return await this.model.find(query, {
          limit,
          sort,
          skip,
        });
      }
      return await new Promise<T[]>((resolve, reject) => {
        this.legacy("Find")(
          query,
          (err: Error | null, res: T[]) => (err ? reject(err) : resolve(res)),
          {},
          {},
          limit,
          sort,
        );
      });
    } catch (error) {
      throw new Error(
        `BaseController.list failed: ${(error as Error).message}`,
      );
    }
  }

  List(
    query: Filter<T>,
    callback?: BaseCallback<T[]>,
    options?: {
      limit?: number;
      sort?: Record<string, 1 | -1>;
      skip?: number;
    },
  ): Promise<T[]> {
    const p = this.list(query, options);
    if (callback) {
      p.then((res) => callback(null, res)).catch((err) => callback(err));
    }
    return p;
  }

  async paginate(
    query: Filter<T> = {},
    options: PaginateOptions = {},
  ): Promise<PaginatedResult<T>> {
    try {
      const page = Math.max(1, options.page || 1);
      const rawLimit = options.limit !== undefined ? options.limit : this.size;
      const limit = Math.min(200, Math.max(1, rawLimit));
      const skip = (page - 1) * limit;
      const sort = options.sort || this.sort;

      const [data, total] = await Promise.all([
        this.list(query, { limit, skip, sort }),
        this.count(query),
      ]);

      const totalPages = Math.max(1, Math.ceil(total / limit));

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      throw new Error(
        `BaseController.paginate failed: ${(error as Error).message}`,
      );
    }
  }

  Paginate(
    query: Filter<T>,
    callback?: BaseCallback<PaginatedResult<T>>,
    options?: PaginateOptions,
  ): Promise<PaginatedResult<T>> {
    const p = this.paginate(query, options);
    if (callback) {
      p.then((res) => callback(null, res)).catch((err) => callback(err));
    }
    return p;
  }

  async cursor(
    query: Filter<T> = {},
    options: CursorOptions = {},
  ): Promise<CursorResult<T>> {
    try {
      const rawLimit = options.limit !== undefined ? options.limit : this.size;
      const limit = Math.min(200, Math.max(1, rawLimit));
      const sort = options.sort || { _id: -1 as const };

      let cursorFilter: Filter<T> = { ...query };
      if (options.after) {
        try {
          const decoded = Buffer.from(options.after, "base64").toString("utf8");
          if (ObjectId.isValid(decoded)) {
            cursorFilter = {
              ...cursorFilter,
              _id: { $lt: new ObjectId(decoded) },
            } as Filter<T>;
          }
        } catch {
          // Fall back if decoding fails
        }
      }

      const items = await this.list(cursorFilter, { limit: limit + 1, sort });
      const hasNextPage = items.length > limit;
      const data = hasNextPage ? items.slice(0, limit) : items;
      const lastItem: T | null = data.length > 0 ? data[data.length - 1] : null;
      const endCursor = lastItem?._id
        ? Buffer.from(String(lastItem._id)).toString("base64")
        : null;

      return {
        data,
        pageInfo: {
          limit,
          hasNextPage,
          endCursor,
        },
      };
    } catch (error) {
      throw new Error(
        `BaseController.cursor failed: ${(error as Error).message}`,
      );
    }
  }

  Cursor(
    query: Filter<T>,
    callback?: BaseCallback<CursorResult<T>>,
    options?: CursorOptions,
  ): Promise<CursorResult<T>> {
    const p = this.cursor(query, options);
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
        this.legacy("FindOne")(query, (err: Error | null, res: T | null) =>
          err ? reject(err) : resolve(res),
        );
      });
    } catch (error) {
      throw new Error(
        `BaseController.getOne failed: ${(error as Error).message}`,
      );
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
        this.legacy("FindByObjectId")(
          this._buildQueryByIndex(id),
          "_id",
          (err: Error | null, res: T | null) =>
            err ? reject(err) : resolve(res),
        );
      });
    } catch (error) {
      throw new Error(
        `BaseController.findById failed: ${(error as Error).message}`,
      );
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
        this.legacy("Insert")(query, (err: Error | null, res: T) =>
          err ? reject(err) : resolve(res),
        );
      });
    } catch (error) {
      throw new Error(
        `BaseController.create failed: ${(error as Error).message}`,
      );
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
        this.legacy("Update")(
          query,
          doc,
          { w: 1 },
          (err: Error | null, res: boolean) =>
            err ? reject(err) : resolve(res),
        );
      });
    } catch (error) {
      throw new Error(
        `BaseController.update failed: ${(error as Error).message}`,
      );
    }
  }

  Update(
    query: Filter<T>,
    doc: UpdateFilter<T> | Partial<T>,
    callback?: BaseCallback<boolean>,
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
        this.legacy("UpdateByObjectId")(
          this._buildQueryByIndex(id),
          doc,
          "_id",
          (err: Error | null, res: boolean) =>
            err ? reject(err) : resolve(res),
        );
      });
    } catch (error) {
      throw new Error(
        `BaseController.updateById failed: ${(error as Error).message}`,
      );
    }
  }

  UpdateById(
    id: string | ObjectId,
    doc: UpdateFilter<T> | Partial<T>,
    callback?: BaseCallback<boolean>,
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
        `BaseController.updateByIdAndQuery failed: ${(error as Error).message}`,
      );
    }
  }

  UpdateByIdAndQuery(
    id: string | ObjectId,
    doc: UpdateFilter<T> | Partial<T>,
    query: Filter<T>,
    callback?: BaseCallback<boolean>,
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
        this.legacy("Remove")(query, (err: Error | null, res: boolean) =>
          err ? reject(err) : resolve(res),
        );
      });
    } catch (error) {
      throw new Error(
        `BaseController.delete failed: ${(error as Error).message}`,
      );
    }
  }

  Delete(query: Filter<T>, callback?: BaseCallback<boolean>): Promise<boolean> {
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
        this.legacy("RemoveByObjectId")(
          this._buildQueryByIndex(id),
          "_id",
          (err: Error | null, res: boolean) =>
            err ? reject(err) : resolve(res),
        );
      });
    } catch (error) {
      throw new Error(
        `BaseController.deleteById failed: ${(error as Error).message}`,
      );
    }
  }

  DeleteById(
    id: string | ObjectId,
    callback?: BaseCallback<boolean>,
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
      const doc = { $inc: { [key]: qty } } as UpdateFilter<T>;
      return await this.updateById(id, doc);
    } catch (error) {
      throw new Error(
        `BaseController.incById failed: ${(error as Error).message}`,
      );
    }
  }

  IncById(
    id: string | ObjectId,
    key: string,
    qty: number,
    callback?: BaseCallback<boolean>,
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
        this.legacy("Aggregate")(
          pipeline,
          (err: Error | null, res: Document[]) =>
            err ? reject(err) : resolve(res),
        );
      });
    } catch (error) {
      throw new Error(
        `BaseController.aggregate failed: ${(error as Error).message}`,
      );
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

  async count(query: Filter<T> = {}): Promise<number> {
    try {
      if (this.model && typeof this.model.count === "function") {
        if (
          Object.keys(query).length === 0 &&
          typeof this.model.estimatedCount === "function"
        ) {
          return await this.model.estimatedCount();
        }
        return await this.model.count(query);
      }
      return 0;
    } catch (error) {
      throw new Error(
        `BaseController.count failed: ${(error as Error).message}`,
      );
    }
  }

  Count(
    query: Filter<T> = {},
    callback?: BaseCallback<number>,
  ): Promise<number> {
    const p = this.count(query);
    if (callback) {
      p.then((res) => callback(null, res)).catch((err) => callback(err));
    }
    return p;
  }

  /**
   * Resolves a legacy callback-style model method, bound to the model.
   * Throws when the wrapped model implements neither the modern nor the
   * legacy variant of the requested operation.
   */
  private legacy<K extends keyof LegacyDataModel<T>>(
    method: K,
  ): NonNullable<LegacyDataModel<T>[K]> {
    const fn = this.model[method];
    if (typeof fn !== "function") {
      throw new Error(`Model does not implement ${method}`);
    }
    return fn.bind(this.model) as NonNullable<LegacyDataModel<T>[K]>;
  }

  private _buildQueryByIndex(
    id: string | ObjectId,
    query: Document = {},
  ): Document {
    return Object.assign({}, query, { _id: id });
  }
}

/** @deprecated Use `BaseController` instead. Kept for plugin compatibility. */
export { BaseController as CBase };

export default BaseController;
