import { Types, type UpdateQuery } from "mongoose";
import {
  BlogPostRepository,
  type BlogPostListFilters,
} from "@/repositories/BlogPostRepository";
import type { PaginatedResult, PaginationOptions } from "@/repositories/BaseRepository";
import { SlugGenerator } from "@/lib/utils/SlugGenerator";
import { HtmlSanitizer } from "@/lib/utils/HtmlSanitizer";
import type {
  BlogPostCreateInput,
  BlogPostUpdateInput,
} from "@/lib/validation/blogPost";
import type { IBlogPost, IBlogPostTranslation } from "@/models/BlogPost";

import { cache } from "react";

export class SlugConflictError extends Error {
  constructor(
    public readonly locale: string,
    public readonly slug: string
  ) {
    super(`Slug "${slug}" is already used for locale "${locale}"`);
    this.name = "SlugConflictError";
  }
}

type TranslationInput = BlogPostCreateInput["translations"][number];

export class BlogPostService {
  constructor(
    private readonly repository: BlogPostRepository = new BlogPostRepository()
  ) {}

  async list(
    filters: BlogPostListFilters,
    options: PaginationOptions
  ): Promise<PaginatedResult<IBlogPost>> {
    return this.repository.listForAdmin(filters, options);
  }

  async getById(id: string): Promise<IBlogPost | null> {
    return this.repository.findById(id);
  }

  async getByLocaleSlug(locale: string, slug: string): Promise<IBlogPost | null> {
    return this.repository.findByLocaleSlug(locale, slug);
  }

  // ─── Public reads (Server Components call these directly — no HTTP round
  // trip through the admin API, and no auth: only "published" posts) ──────

  async listPublished(
    options: PaginationOptions & { tag?: string } = {}
  ): Promise<PaginatedResult<IBlogPost>> {
    return this.repository.listPublished(options);
  }

  getPublishedByLocaleSlug = cache(
    async (locale: string, slug: string): Promise<IBlogPost | null> => {
      try {
        return await this.repository.findPublishedByLocaleSlug(locale, slug);
      } catch {
        return null;
      }
    }
  );

  async getRecentPublished(
    limit: number,
    excludePostId?: string
  ): Promise<IBlogPost[]> {
    return this.repository.recentPublished(limit, excludePostId);
  }

  async getPublishedTags(): Promise<string[]> {
    return this.repository.listPublishedTags();
  }

  async getDashboardStats(): Promise<{
    total: number;
    published: number;
    draft: number;
  }> {
    return this.repository.countPublishedByStatus();
  }

  async create(
    input: BlogPostCreateInput,
    actorId: string
  ): Promise<IBlogPost> {
    const translations = await this.resolveTranslations(input.translations);
    const actorObjectId = new Types.ObjectId(actorId);

    return this.repository.create({
      coverImageKey: input.coverImageKey,
      tags: input.tags,
      status: input.status,
      publishedAt: input.status === "published" ? new Date() : undefined,
      translations,
      authorId: actorObjectId,
      createdBy: actorObjectId,
      updatedBy: actorObjectId,
    });
  }

  async update(
    id: string,
    input: BlogPostUpdateInput,
    actorId: string
  ): Promise<IBlogPost | null> {
    const existing = await this.repository.findById(id);
    if (!existing) return null;

    const update: UpdateQuery<IBlogPost> = { updatedBy: actorId };

    if (input.coverImageKey !== undefined) {
      update.coverImageKey = input.coverImageKey ?? undefined;
    }
    if (input.tags !== undefined) {
      update.tags = input.tags;
    }
    if (input.translations !== undefined) {
      update.translations = await this.resolveTranslations(
        input.translations,
        id
      );
    }
    if (input.status !== undefined) {
      update.status = input.status;
      // publishedAt records the first time a post went live; it is not
      // cleared on unpublish, and not bumped on re-publish.
      if (input.status === "published" && !existing.publishedAt) {
        update.publishedAt = new Date();
      }
    }

    return this.repository.updateById(id, update);
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await this.repository.deleteById(id);
    return Boolean(deleted);
  }

  private async resolveTranslations(
    translations: TranslationInput[],
    excludePostId?: string
  ): Promise<IBlogPostTranslation[]> {
    const resolved: IBlogPostTranslation[] = [];

    for (const t of translations) {
      let slug: string;
      if (t.slug) {
        const taken = await this.repository.isSlugTaken(
          t.locale,
          t.slug,
          excludePostId
        );
        if (taken) {
          throw new SlugConflictError(t.locale, t.slug);
        }
        slug = t.slug;
      } else {
        slug = await SlugGenerator.generateUnique(t.title, (candidate) =>
          this.repository.isSlugTaken(t.locale, candidate, excludePostId)
        );
      }

      resolved.push({
        locale: t.locale,
        title: t.title,
        slug,
        excerpt: t.excerpt,
        content: HtmlSanitizer.sanitize(t.content),
        seoTitle: t.seoTitle,
        seoDescription: t.seoDescription,
        seoKeywords: t.seoKeywords,
        ogImageKey: t.ogImageKey,
      });
    }

    return resolved;
  }
}

export const blogPostService = new BlogPostService();
