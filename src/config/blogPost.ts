/**
 * Lives outside src/models/BlogPost.ts (which pulls in the full Mongoose +
 * MongoDB driver chain) so the validation layer — and its unit tests — can
 * depend on just the status enum without loading Mongoose.
 */
export const BLOG_POST_STATUSES = ["draft", "published"] as const;
export type BlogPostStatus = (typeof BLOG_POST_STATUSES)[number];
