import type {
  Document,
  Model,
  ProjectionType,
  QueryFilter,
  UpdateQuery,
} from "mongoose";
import { Database } from "@/lib/db/mongodb";

export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  sort?: Record<string, 1 | -1>;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;

/**
 * Generic CRUD wrapper around a Mongoose model. Concrete repositories extend
 * this for entity-specific finders instead of every service talking to
 * Mongoose directly — keeps query logic reusable and testable, and gives us
 * one place (`ready()`) that guarantees the DB connection is open first.
 *
 * TODO: test — repository/service/route integration tests need a real (or
 * mongodb-memory-server) MongoDB instance and a mocked next-auth session,
 * neither of which is wired up in this environment yet. Pure-logic units
 * (SlugGenerator, HtmlSanitizer, Zod schemas, permission config helpers)
 * are covered under tests/unit/; add DB-backed tests under
 * tests/integration/ once a test database is available.
 */
export abstract class BaseRepository<T extends Document> {
  protected constructor(protected readonly model: Model<T>) {}

  protected async ready(): Promise<Model<T>> {
    await Database.connect();
    return this.model;
  }

  async create(data: Partial<T>): Promise<T> {
    const model = await this.ready();
    const doc = new model(data);
    return doc.save();
  }

  async findById(
    id: string,
    projection?: ProjectionType<T>
  ): Promise<T | null> {
    const model = await this.ready();
    return model.findById(id, projection).exec();
  }

  async findOne(
    filter: QueryFilter<T>,
    projection?: ProjectionType<T>
  ): Promise<T | null> {
    const model = await this.ready();
    return model.findOne(filter, projection).exec();
  }

  async find(filter: QueryFilter<T> = {}): Promise<T[]> {
    const model = await this.ready();
    return model.find(filter).exec();
  }

  async paginate(
    filter: QueryFilter<T> = {},
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<T>> {
    const model = await this.ready();
    const page = Math.max(1, options.page ?? 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, options.pageSize ?? DEFAULT_PAGE_SIZE)
    );
    const sort = options.sort ?? { createdAt: -1 };

    const [items, total] = await Promise.all([
      model
        .find(filter)
        .sort(sort)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .exec(),
      model.countDocuments(filter).exec(),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async updateById(id: string, update: UpdateQuery<T>): Promise<T | null> {
    const model = await this.ready();
    return model
      .findByIdAndUpdate(id, update, { returnDocument: "after", runValidators: true })
      .exec();
  }

  async deleteById(id: string): Promise<T | null> {
    const model = await this.ready();
    return model.findByIdAndDelete(id).exec();
  }

  async count(filter: QueryFilter<T> = {}): Promise<number> {
    const model = await this.ready();
    return model.countDocuments(filter).exec();
  }
}
