import { Types } from "mongoose";
import { BrandStoryModel, type IBrandStory, type IBrandStoryChapter } from "@/models/BrandStory";
import { BaseRepository } from "./BaseRepository";

export class BrandStoryRepository extends BaseRepository<IBrandStory> {
  constructor() {
    super(BrandStoryModel);
  }

  /** The one Brand Story document, if it's ever been saved. */
  async get(): Promise<IBrandStory | null> {
    const model = await this.ready();
    return model.findOne().lean<IBrandStory>().exec();
  }

  /** Upserts the singleton — whole-array replace, mirroring how /api/permissions replaces a role's whole matrix. */
  async replaceChapters(chapters: IBrandStoryChapter[], actorId: string): Promise<IBrandStory> {
    const model = await this.ready();
    const existing = await model.findOne().exec();
    if (existing) {
      existing.chapters = chapters;
      existing.updatedBy = new Types.ObjectId(actorId);
      return existing.save();
    }
    return new model({ chapters, updatedBy: new Types.ObjectId(actorId) }).save();
  }

  /**
   * True if `key` belongs to any chapter's images in the current Brand Story
   * — the gate for the public image proxy, mirroring BeerRepository.isKeyPubliclyVisible.
   * Unlike Beer/BlogPost there's no draft/published status here: whatever is
   * saved is what the homepage flipbook shows.
   */
  async isKeyPubliclyVisible(key: string): Promise<boolean> {
    const model = await this.ready();
    const count = await model.countDocuments({ "chapters.images": key }).exec();
    return count > 0;
  }
}
