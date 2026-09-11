import { HeroSectionRepository } from "@/repositories/HeroSectionRepository";
import type { HeroSectionUpdateInput } from "@/lib/validation/heroSection";
import type { IHeroSection, IHeroSlide } from "@/models/HeroSection";

export class HeroSectionService {
  constructor(
    private readonly repository: HeroSectionRepository = new HeroSectionRepository()
  ) {}

  async get(): Promise<IHeroSection | null> {
    return this.repository.get();
  }

  async replaceSlides(
    input: HeroSectionUpdateInput,
    actorId: string
  ): Promise<IHeroSection> {
    return this.repository.replaceSlides(input.slides, actorId);
  }

  // ─── Public reads (Server Components can call these directly — no HTTP
  // round trip) ─────────────────────────────────────────────────────────

  /**
   * Published slides only, in admin-defined order. Drafts stay admin-only.
   * Called from the homepage (`page.tsx`), mapped through
   * HeroSectionPresenter.toSlideItem() and passed to HeroSection as `slides`.
   */
  async listPublishedSlides(): Promise<IHeroSlide[]> {
    const heroSection = await this.repository.get();
    return (heroSection?.slides ?? []).filter(
      (slide) => slide.status === "published"
    );
  }
}

export const heroSectionService = new HeroSectionService();
