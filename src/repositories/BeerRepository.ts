import { BeerModel, type IBeer } from "@/models/Beer";
import {
  BaseRepository,
  type PaginatedResult,
  type PaginationOptions,
} from "./BaseRepository";

export interface BeerListFilters {
  status?: "draft" | "published";
  /** Full-text-ish search across every language's style/headline. */
  search?: string;
}

export class BeerRepository extends BaseRepository<IBeer> {
  constructor() {
    super(BeerModel);
  }

  async listForAdmin(
    filters: BeerListFilters = {},
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<IBeer>> {
    const query: Record<string, unknown> = {};
    if (filters.status) query.status = filters.status;
    if (filters.search) {
      query["translations.style"] = { $regex: filters.search, $options: "i" };
    }

    const model = await this.ready();
    const page = Math.max(1, options.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 20));
    const sort = options.sort ?? { createdAt: -1 };

    const [items, total] = await Promise.all([
      model.find(query).sort(sort).skip((page - 1) * pageSize).limit(pageSize).exec(),
      model.countDocuments(query).exec(),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  /** Un-sets isFeatured on every beer except `id` — keeps "at most one featured beer" true without a transaction. */
  async clearFeaturedExcept(id: string): Promise<void> {
    const model = await this.ready();
    await model
      .updateMany({ _id: { $ne: id }, isFeatured: true }, { $set: { isFeatured: false } })
      .exec();
  }

  // ─── Public reads (no auth — status: "published" only) ─────────────

  /** The single beer shown on the homepage hero, if any. */
  async findFeaturedPublished(): Promise<IBeer | null> {
    const model = await this.ready();
    return model
      .findOne({ status: "published", isFeatured: true })
      .sort({ updatedAt: -1 })
      .lean<IBeer>()
      .exec();
  }

  /** Every published beer, newest first — backs the homepage showcase carousel. Uses the {status, createdAt} index, no cap. */
  async listShowcasePublished(): Promise<IBeer[]> {
    const model = await this.ready();
    return model
      .find({ status: "published" })
      .sort({ createdAt: -1 })
      .lean<IBeer[]>()
      .exec();
  }

  /**
   * True if `key` is a published beer's image — the gate for the public
   * image proxy (src/app/api/media/public/[...key]/route.ts), mirroring
   * BlogPostRepository.isKeyPubliclyVisible.
   *
   * Matches variant photos as well as the main image: a variant's can/6-pack
   * shot is rendered to logged-out visitors just like `imageKey` is, so
   * leaving it out of this gate would 404 every packaging image in
   * production while still looking fine to a logged-in admin.
   */
  async isKeyPubliclyVisible(key: string): Promise<boolean> {
    const model = await this.ready();
    const count = await model
      .countDocuments({
        status: "published",
        $or: [{ imageKey: key }, { "variants.imageKey": key }],
      })
      .exec();
    return count > 0;
  }
}
