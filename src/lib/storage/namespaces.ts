import { MODULE_KEYS, type ModuleKey } from "@/config/permissions";

/**
 * The storage folders content uploads may land in, one per admin module.
 *
 * Before this existed, every upload — a beer photo, a brand-story
 * illustration — was written into the hardcoded "news-blog" folder and
 * authorized against the news_blog grant alone, which meant an editor with
 * beers or brand_story rights but no blog rights got a 404 from
 * /api/media/upload-url. Namespacing the request fixes both halves: the
 * folder matches the module, and the permission checked is that module's.
 */
export const MEDIA_NAMESPACES = [
  "news-blog",
  "beers",
  "brand-story",
  "hero",
] as const;

export type MediaNamespace = (typeof MEDIA_NAMESPACES)[number];

/** Which permission module governs uploads into each namespace. */
export const MODULE_BY_MEDIA_NAMESPACE: Record<MediaNamespace, ModuleKey> = {
  "news-blog": MODULE_KEYS.NEWS_BLOG,
  beers: MODULE_KEYS.BEERS,
  "brand-story": MODULE_KEYS.BRAND_STORY,
  hero: MODULE_KEYS.HERO_SECTION,
};

/**
 * Video is a hero-section affordance only. Every other module renders its
 * media through <img>/next/image, so accepting a clip there would store
 * something nothing can play.
 */
export const VIDEO_ENABLED_NAMESPACES: readonly MediaNamespace[] = ["hero"];

export function allowsVideo(namespace: MediaNamespace): boolean {
  return VIDEO_ENABLED_NAMESPACES.includes(namespace);
}

export function isMediaNamespace(value: string): value is MediaNamespace {
  return (MEDIA_NAMESPACES as readonly string[]).includes(value);
}
