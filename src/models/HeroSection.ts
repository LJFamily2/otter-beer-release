import {
  Schema,
  model,
  models,
  Types,
  type Document,
  type Model,
} from "mongoose";
import {
  HERO_MEDIA_TYPES,
  HERO_SLIDE_STATUSES,
  type HeroMediaType,
  type HeroSlideStatus,
} from "@/config/heroSlide";

export {
  HERO_MEDIA_TYPES,
  HERO_SLIDE_STATUSES,
  type HeroMediaType,
  type HeroSlideStatus,
};

/**
 * One language's worth of copy for a single hero slide — mirrors
 * IBrandStoryPageTranslation's array-of-subdocuments shape, so adding a
 * language later is a new array entry and no migration.
 *
 * Only alt text for now: the shipped homepage carousel renders no copy over
 * the image, it just reads the alt out through its aria-live region.
 */
export interface IHeroSlideTranslation {
  locale: string;
  /** Describes the slide for screen readers, e.g. "Otter Beer – Premium Lager". */
  alt: string;
}

export interface IHeroSlide {
  /** Storage key for the slide's image or video — see src/lib/storage. */
  mediaKey: string;
  /** Storage key for the slide's mobile image (vertical). */
  mobileMediaKey?: string;
  /** Which of the two the key points at; drives <img> vs <video> at render time. */
  mediaType: HeroMediaType;
  /** Per-slide, so a slide can be staged without pulling the whole hero down. */
  status: HeroSlideStatus;
  translations: IHeroSlideTranslation[];
}

/**
 * Singleton document — there is exactly one Hero Section (the homepage
 * carousel's ordered slide list), not a collection of independently
 * CRUD-able records. Mirrors BrandStory; see
 * HeroSectionRepository.get()/replaceSlides().
 */
export interface IHeroSection extends Document {
  slides: IHeroSlide[];
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const HeroSlideTranslationSchema = new Schema<IHeroSlideTranslation>(
  {
    locale: { type: String, required: true, trim: true, lowercase: true },
    alt: { type: String, required: true, trim: true, maxlength: 200 },
  },
  { _id: false }
);

const HeroSlideSchema = new Schema<IHeroSlide>(
  {
    mediaKey: { type: String, required: true, trim: true },
    mobileMediaKey: { type: String, trim: true },
    mediaType: {
      type: String,
      enum: HERO_MEDIA_TYPES,
      required: true,
      default: "image",
    },
    status: {
      type: String,
      enum: HERO_SLIDE_STATUSES,
      required: true,
      default: "draft",
    },
    translations: { type: [HeroSlideTranslationSchema], default: [] },
  },
  { _id: false }
);

const HeroSectionSchema = new Schema<IHeroSection>(
  {
    slides: { type: [HeroSlideSchema], default: [] },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const HeroSectionModel: Model<IHeroSection> =
  (models.HeroSection as Model<IHeroSection>) ||
  model<IHeroSection>("HeroSection", HeroSectionSchema);
