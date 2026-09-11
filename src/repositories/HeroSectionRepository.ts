import { Types } from "mongoose";
import {
  HeroSectionModel,
  type IHeroSection,
  type IHeroSlide,
} from "@/models/HeroSection";
import { BaseRepository } from "./BaseRepository";

export class HeroSectionRepository extends BaseRepository<IHeroSection> {
  constructor() {
    super(HeroSectionModel);
  }

  /** The one Hero Section document, if it's ever been saved. */
  async get(): Promise<IHeroSection | null> {
    const model = await this.ready();
    return model.findOne().lean<IHeroSection>().exec();
  }

  /** Upserts the singleton — whole-array replace, mirroring BrandStoryRepository.replaceChapters. */
  async replaceSlides(
    slides: IHeroSlide[],
    actorId: string
  ): Promise<IHeroSection> {
    const model = await this.ready();
    const existing = await model.findOne().exec();
    if (existing) {
      existing.slides = slides;
      existing.updatedBy = new Types.ObjectId(actorId);
      return existing.save();
    }
    return new model({ slides, updatedBy: new Types.ObjectId(actorId) }).save();
  }

  /**
   * True if `key` belongs to a *published* hero slide — the gate for the
   * public media proxy. Unlike BrandStory (where everything saved is live),
   * slides carry their own status, so a draft slide's media stays admin-only
   * exactly like an unpublished post's cover image does.
   */
  async isKeyPubliclyVisible(key: string): Promise<boolean> {
    const model = await this.ready();
    const count = await model
      .countDocuments({
        slides: { 
          $elemMatch: { 
            $or: [{ mediaKey: key }, { mobileMediaKey: key }],
            status: "published" 
          } 
        },
      })
      .exec();
    return count > 0;
  }
}
