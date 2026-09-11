import { BrandStoryRepository } from "@/repositories/BrandStoryRepository";
import type { BrandStoryUpdateInput } from "@/lib/validation/brandStory";
import type { IBrandStory } from "@/models/BrandStory";

export class BrandStoryService {
  constructor(
    private readonly repository: BrandStoryRepository = new BrandStoryRepository()
  ) {}

  async get(): Promise<IBrandStory | null> {
    return this.repository.get();
  }

  async replaceChapters(
    input: BrandStoryUpdateInput,
    actorId: string
  ): Promise<IBrandStory> {
    return this.repository.replaceChapters(input.chapters, actorId);
  }

  // ─── Public reads (Server Components can call this directly — no HTTP
  // round trip). Called from the homepage (`page.tsx`), mapped through
  // BrandStoryPresenter.toBookChapters() and passed to BrandStorySection
  // as `chapters`. ─────────────────────────────────────────────────────
  async getPublished(): Promise<IBrandStory | null> {
    return this.repository.get();
  }
}

export const brandStoryService = new BrandStoryService();
