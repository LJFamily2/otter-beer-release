import { BlogPostModel, type IBlogPost } from "@/models/BlogPost";
import {
  BaseRepository,
  type PaginatedResult,
  type PaginationOptions,
} from "./BaseRepository";

export interface BlogPostListFilters {
  status?: "draft" | "published";
  tag?: string;
  /** Full-text-ish search across every language's title/excerpt. */
  search?: string;
}

export class BlogPostRepository extends BaseRepository<IBlogPost> {
  constructor() {
    super(BlogPostModel);
  }

  async findByLocaleSlug(
    locale: string,
    slug: string
  ): Promise<IBlogPost | null> {
    return this.findOne({
      translations: { $elemMatch: { locale, slug } },
    });
  }

  async listForAdmin(
    filters: BlogPostListFilters = {},
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<IBlogPost>> {
    const query: Record<string, unknown> = {};
    if (filters.status) query.status = filters.status;
    if (filters.tag) query.tags = filters.tag;
    if (filters.search) {
      query["translations.title"] = {
        $regex: filters.search,
        $options: "i",
      };
    }

    const model = await this.ready();
    const page = Math.max(1, options.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 20));
    const sort = options.sort ?? { createdAt: -1 };

    const [items, total] = await Promise.all([
      model
        .find(query)
        .populate("authorId", "name email image")
        .sort(sort)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .exec(),
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

  async isSlugTaken(
    locale: string,
    slug: string,
    excludePostId?: string
  ): Promise<boolean> {
    const model = await this.ready();
    const query: Record<string, unknown> = {
      translations: { $elemMatch: { locale, slug } },
    };
    if (excludePostId) {
      query._id = { $ne: excludePostId };
    }
    const count = await model.countDocuments(query).exec();
    return count > 0;
  }

  // ─── Public reads (no auth — status: "published" only) ─────────────

  async findPublishedByLocaleSlug(
    locale: string,
    slug: string
  ): Promise<IBlogPost | null> {
    const model = await this.ready();
    return model
      .findOne({
        status: "published",
        translations: { $elemMatch: { locale, slug } },
      })
      .populate("authorId", "name image")
      .lean<IBlogPost>()
      .exec();
  }

  async listPublished(
    options: PaginationOptions & { tag?: string } = {}
  ): Promise<PaginatedResult<IBlogPost>> {
    const query: Record<string, unknown> = { status: "published" };
    if (options.tag) query.tags = options.tag;

    const model = await this.ready();
    const page = Math.max(1, options.page ?? 1);
    const pageSize = Math.min(50, Math.max(1, options.pageSize ?? 9));
    const sort = options.sort ?? { publishedAt: -1 };

    const selectFields =
      "coverImageKey authorId tags status publishedAt translations.locale translations.title translations.slug translations.excerpt createdAt updatedAt";

    const [items, total] = await Promise.all([
      model
        .find(query)
        .select(selectFields)
        .populate("authorId", "name image")
        .sort(sort)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean<IBlogPost[]>()
        .exec(),
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

  /** Most recently published posts, for "Recent Logs" sidebars — excludes one post (the article being viewed) when given. */
  async recentPublished(
    limit: number,
    excludePostId?: string
  ): Promise<IBlogPost[]> {
    const model = await this.ready();
    const query: Record<string, unknown> = { status: "published" };
    if (excludePostId) query._id = { $ne: excludePostId };
    const selectFields =
      "coverImageKey publishedAt translations.locale translations.title translations.slug translations.excerpt";
    return model
      .find(query)
      .select(selectFields)
      .sort({ publishedAt: -1 })
      .limit(limit)
      .lean<IBlogPost[]>()
      .exec();
  }

  /** Distinct tags across published posts only — powers the public "Topics Cloud". */
  async listPublishedTags(): Promise<string[]> {
    const model = await this.ready();
    return model.distinct("tags", { status: "published" }).exec();
  }

  async countPublishedByStatus(): Promise<{
    total: number;
    published: number;
    draft: number;
  }> {
    const model = await this.ready();
    const [total, published, draft] = await Promise.all([
      model.countDocuments({}).exec(),
      model.countDocuments({ status: "published" }).exec(),
      model.countDocuments({ status: "draft" }).exec(),
    ]);
    return { total, published, draft };
  }

  /**
   * True if `key` is used as a cover/OG image or appears inline in a
   * published post's content — the gate for the public image proxy
   * (src/app/api/media/public/[...key]/route.ts) so drafts' images stay
   * unreachable without auth.
   */
  async isKeyPubliclyVisible(key: string): Promise<boolean> {
    const model = await this.ready();
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const count = await model
      .countDocuments({
        status: "published",
        $or: [
          { coverImageKey: key },
          { "translations.ogImageKey": key },
          { "translations.content": { $regex: escapedKey } },
        ],
      })
      .exec();
    return count > 0;
  }
}
