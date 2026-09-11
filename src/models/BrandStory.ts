import {
  Schema,
  model,
  models,
  Types,
  type Document,
  type Model,
} from "mongoose";

/** One language's worth of copy for a chapter — mirrors IBeerTranslation's array-of-subdocuments shape. */
export interface IBrandStoryChapterTranslation {
  locale: string;
  /** Tab label / sr-only page heading, e.g. "Our Story". */
  title: string;
}

/**
 * A chapter is a *group* of images, not a single page. The reader turns
 * through every image in a chapter before the next chapter's tab becomes
 * current — see src/config/brandStoryChapters.ts, which lays this same
 * shape out into two-page spreads for the flipbook.
 */
export interface IBrandStoryChapter {
  /** Ordered storage keys for the chapter's illustrations/photos — see src/lib/storage. */
  images: string[];
  translations: IBrandStoryChapterTranslation[];
}

/**
 * Singleton document — there is exactly one Brand Story (the homepage
 * flipbook's ordered chapter list), not a collection of independently
 * CRUD-able records. See BrandStoryRepository.get()/replaceChapters().
 */
export interface IBrandStory extends Document {
  chapters: IBrandStoryChapter[];
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BrandStoryChapterTranslationSchema = new Schema<IBrandStoryChapterTranslation>(
  {
    locale: { type: String, required: true, trim: true, lowercase: true },
    title: { type: String, required: true, trim: true, maxlength: 80 },
  },
  { _id: false }
);

const BrandStoryChapterSchema = new Schema<IBrandStoryChapter>(
  {
    images: { type: [String], default: [] },
    translations: { type: [BrandStoryChapterTranslationSchema], default: [] },
  },
  { _id: false }
);

const BrandStorySchema = new Schema<IBrandStory>(
  {
    chapters: { type: [BrandStoryChapterSchema], default: [] },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const BrandStoryModel: Model<IBrandStory> =
  (models.BrandStory as Model<IBrandStory>) ||
  model<IBrandStory>("BrandStory", BrandStorySchema);
