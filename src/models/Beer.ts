import {
  Schema,
  model,
  models,
  Types,
  type Document,
  type Model,
} from "mongoose";
import { BEER_STATUSES, type BeerStatus } from "@/config/beer";

export { BEER_STATUSES, type BeerStatus };

/**
 * One language's worth of editable copy for a beer — mirrors
 * IBlogPostTranslation's array-of-subdocuments shape (see
 * src/models/BlogPost.ts) so adding a language later is just a new array
 * entry, no schema/migration change.
 */
export interface IBeerTranslation {
  locale: string;
  /** e.g. "PREMIUM LAGER" — shown as the small spec-card label. */
  style: string;
  /** Hero headline; line breaks are preserved so an editor controls the wrap. */
  headline: string;
  /** Tagline/description under the headline; line breaks preserved. */
  description: string;
}

/**
 * One language's label for a variant — "Lon" / "Can". Mirrors
 * IBeerTranslation's array-of-subdocuments shape so the image stays shared
 * across languages while the label follows the site's locale.
 */
export interface IBeerVariantName {
  locale: string;
  /** Pill label under the showcase image, e.g. "Bao bi 6 lon". */
  shortName: string;
}

/**
 * One selectable version of a beer — most often a packaging format (single
 * can, 6-pack, 24-case). Each carries its own photo; the showcase swaps the
 * hero image when a visitor picks one.
 */
export interface IBeerVariant {
  imageKey: string;
  names: IBeerVariantName[];
}

export interface IBeer extends Document {
  imageKey?: string;
  /**
   * Per-locale label for `imageKey`, used as the first pill in the showcase's
   * variant picker. Only meaningful once `variants` is non-empty — a beer
   * with no variants shows its image with no picker, so it needs no label.
   */
  imageNames: IBeerVariantName[];
  abv: number;
  ibu: number;
  shopUrl?: string;
  findLocallyUrl?: string;
  /** Hex color (#RRGGBB) driving the homepage showcase's --color-primary for this beer. Unset falls back to the brand default at render time. */
  themeColor?: string;
  /** Hex color (#RRGGBB) driving the homepage showcase's --color-primary-container for this beer. Unset falls back to the brand default at render time. */
  themeColorContainer?: string;
  /** At most one beer is featured at a time — see BeerService — and only a featured + published beer renders on the homepage hero. */
  isFeatured: boolean;
  status: BeerStatus;
  translations: IBeerTranslation[];
  /**
   * Product variants — packaging (single can / 6-pack / case) is the
   * motivating case, but nothing here is packaging-specific: a variant is
   * just an image plus a label. Empty for beers with only one look — the
   * showcase then falls back to `imageKey` and renders no picker, which is
   * exactly how every beer behaved before variants existed.
   */
  variants: IBeerVariant[];
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BeerTranslationSchema = new Schema<IBeerTranslation>(
  {
    locale: { type: String, required: true, trim: true, lowercase: true },
    style: { type: String, required: true, trim: true, maxlength: 60 },
    headline: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 400 },
  },
  { _id: false }
);

const BeerVariantNameSchema = new Schema<IBeerVariantName>(
  {
    locale: { type: String, required: true, trim: true, lowercase: true },
    shortName: { type: String, required: true, trim: true, maxlength: 40 },
  },
  { _id: false }
);

const BeerVariantSchema = new Schema<IBeerVariant>(
  {
    imageKey: { type: String, required: true, trim: true },
    names: {
      type: [BeerVariantNameSchema],
      default: [],
      validate: {
        validator: (v: IBeerVariantName[]) => v.length > 0,
        message: "At least one language's label is required per variant.",
      },
    },
  },
  { _id: false }
);

const BeerSchema = new Schema<IBeer>(
  {
    imageKey: { type: String, trim: true },
    imageNames: { type: [BeerVariantNameSchema], default: [] },
    abv: { type: Number, required: true, min: 0, max: 100 },
    ibu: { type: Number, required: true, min: 0, max: 200 },
    shopUrl: { type: String, trim: true },
    findLocallyUrl: { type: String, trim: true },
    themeColor: { type: String, trim: true, uppercase: true },
    themeColorContainer: { type: String, trim: true, uppercase: true },
    isFeatured: { type: Boolean, required: true, default: false },
    status: {
      type: String,
      enum: BEER_STATUSES,
      required: true,
      default: "draft",
    },
    translations: {
      type: [BeerTranslationSchema],
      default: [],
      validate: {
        validator: (v: IBeerTranslation[]) => v.length > 0,
        message: "At least one language's content is required.",
      },
    },
    variants: { type: [BeerVariantSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

BeerSchema.index({ "translations.locale": 1 });
BeerSchema.index({ status: 1, isFeatured: 1 });
/** Backs the variant half of BeerRepository.isKeyPubliclyVisible — hit on every public media request. */
BeerSchema.index({ "variants.imageKey": 1 });
/** Backs BeerRepository.listShowcasePublished — status filter + createdAt sort in one index scan. */
BeerSchema.index({ status: 1, createdAt: -1 });

export const BeerModel: Model<IBeer> =
  (models.Beer as Model<IBeer>) || model<IBeer>("Beer", BeerSchema);
