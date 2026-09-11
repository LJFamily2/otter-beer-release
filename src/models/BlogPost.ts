import {
  Schema,
  model,
  models,
  Types,
  type Document,
  type Model,
} from "mongoose";
import { BLOG_POST_STATUSES, type BlogPostStatus } from "@/config/blogPost";

export { BLOG_POST_STATUSES, type BlogPostStatus };

/**
 * One language's worth of editable content for a post. Stored as an array
 * element (not a Mongoose Map) so MongoDB can multikey-index
 * (locale, slug) for uniqueness — adding a new language later is just a
 * new array entry, no schema/migration change.
 */
export interface IBlogPostTranslation {
  locale: string;
  title: string;
  slug: string;
  excerpt: string;
  /** Sanitized HTML from the WYSIWYG editor — see HtmlSanitizer. */
  content: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords: string[];
  /** R2 object key; falls back to the post's coverImageKey when unset. */
  ogImageKey?: string;
}

export interface IBlogPost extends Document {
  coverImageKey?: string;
  authorId: Types.ObjectId;
  tags: string[];
  status: BlogPostStatus;
  publishedAt?: Date;
  translations: IBlogPostTranslation[];
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BlogPostTranslationSchema = new Schema<IBlogPostTranslation>(
  {
    locale: { type: String, required: true, trim: true, lowercase: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: /^[a-z0-9-]+$/,
    },
    excerpt: { type: String, required: true, trim: true, maxlength: 300 },
    content: { type: String, required: true },
    seoTitle: { type: String, trim: true, maxlength: 70 },
    seoDescription: { type: String, trim: true, maxlength: 160 },
    seoKeywords: { type: [String], default: [] },
    ogImageKey: { type: String, trim: true },
  },
  { _id: false }
);

const BlogPostSchema = new Schema<IBlogPost>(
  {
    coverImageKey: { type: String, trim: true },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tags: { type: [String], default: [] },
    status: {
      type: String,
      enum: BLOG_POST_STATUSES,
      required: true,
      default: "draft",
    },
    publishedAt: { type: Date },
    translations: {
      type: [BlogPostTranslationSchema],
      default: [],
      validate: {
        validator: (v: IBlogPostTranslation[]) => v.length > 0,
        message: "At least one language's content is required.",
      },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Uniqueness of a slug is scoped per-language, not globally — "tin-tuc" (vi)
// and "tin-tuc" (en) on two different posts would collide here on purpose.
BlogPostSchema.index(
  { "translations.locale": 1, "translations.slug": 1 },
  { unique: true }
);
BlogPostSchema.index({ status: 1, publishedAt: -1 });
BlogPostSchema.index({ tags: 1 });

export const BlogPostModel: Model<IBlogPost> =
  (models.BlogPost as Model<IBlogPost>) ||
  model<IBlogPost>("BlogPost", BlogPostSchema);
