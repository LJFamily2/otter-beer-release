import { Types, type UpdateQuery } from "mongoose";
import { BeerRepository, type BeerListFilters } from "@/repositories/BeerRepository";
import type { PaginatedResult, PaginationOptions } from "@/repositories/BaseRepository";
import type { BeerCreateInput, BeerUpdateInput } from "@/lib/validation/beer";
import type { IBeer } from "@/models/Beer";

export class BeerService {
  constructor(
    private readonly repository: BeerRepository = new BeerRepository()
  ) {}

  async list(
    filters: BeerListFilters,
    options: PaginationOptions
  ): Promise<PaginatedResult<IBeer>> {
    return this.repository.listForAdmin(filters, options);
  }

  async getById(id: string): Promise<IBeer | null> {
    return this.repository.findById(id);
  }

  // ─── Public reads (Server Components call these directly — no HTTP round
  // trip through the admin API, and no auth: only "published" beers) ──────

  async getFeaturedPublished(): Promise<IBeer | null> {
    return this.repository.findFeaturedPublished();
  }

  async listShowcasePublished(): Promise<IBeer[]> {
    return this.repository.listShowcasePublished();
  }

  private async revalidatePublicPages(): Promise<void> {
    try {
      const { revalidatePath } = await import("next/cache");
      revalidatePath("/[locale]", "page");
      revalidatePath("/[locale]/menu", "page");
    } catch {
      // Ignored outside Next.js request context (e.g. unit tests)
    }
  }

  async create(input: BeerCreateInput, actorId: string): Promise<IBeer> {
    const actorObjectId = new Types.ObjectId(actorId);
    const created = await this.repository.create({
      imageKey: input.imageKey,
      abv: input.abv,
      ibu: input.ibu,
      shopUrl: input.shopUrl,
      findLocallyUrl: input.findLocallyUrl,
      themeColor: input.themeColor,
      themeColorContainer: input.themeColorContainer,
      isFeatured: input.isFeatured,
      status: input.status,
      translations: input.translations,
      variants: input.variants,
      imageNames: input.imageNames,
      createdBy: actorObjectId,
      updatedBy: actorObjectId,
    });

    if (created.isFeatured) {
      await this.repository.clearFeaturedExcept(String(created._id));
    }
    this.revalidatePublicPages();
    return created;
  }

  async update(
    id: string,
    input: BeerUpdateInput,
    actorId: string
  ): Promise<IBeer | null> {
    const existing = await this.repository.findById(id);
    if (!existing) return null;

    const update: UpdateQuery<IBeer> = { updatedBy: actorId };
    if (input.imageKey !== undefined) update.imageKey = input.imageKey ?? undefined;
    if (input.abv !== undefined) update.abv = input.abv;
    if (input.ibu !== undefined) update.ibu = input.ibu;
    if (input.shopUrl !== undefined) update.shopUrl = input.shopUrl ?? undefined;
    if (input.findLocallyUrl !== undefined) update.findLocallyUrl = input.findLocallyUrl ?? undefined;
    if (input.themeColor !== undefined) update.themeColor = input.themeColor ?? undefined;
    if (input.themeColorContainer !== undefined) update.themeColorContainer = input.themeColorContainer ?? undefined;
    if (input.isFeatured !== undefined) update.isFeatured = input.isFeatured;
    if (input.status !== undefined) update.status = input.status;
    if (input.translations !== undefined) update.translations = input.translations;
    if (input.variants !== undefined) update.variants = input.variants;
    if (input.imageNames !== undefined) update.imageNames = input.imageNames;

    const updated = await this.repository.updateById(id, update);
    if (updated?.isFeatured) {
      await this.repository.clearFeaturedExcept(id);
    }
    this.revalidatePublicPages();
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await this.repository.deleteById(id);
    if (deleted) {
      this.revalidatePublicPages();
    }
    return Boolean(deleted);
  }
}

export const beerService = new BeerService();
