/**
 * Hero section slide configuration — the homepage hero carousel's admin-owned
 * settings, kept here (dependency-free) so client components, Zod schemas, the
 * Mongoose model, and the storage layer can all share one source of truth
 * without importing each other. Mirrors src/config/beer.ts / blogPost.ts.
 */

export const HERO_SLIDE_STATUSES = ["draft", "published"] as const;

export type HeroSlideStatus = (typeof HERO_SLIDE_STATUSES)[number];

/** Whether a slide holds a still image or a video clip. */
export const HERO_MEDIA_TYPES = ["image", "video"] as const;

export type HeroMediaType = (typeof HERO_MEDIA_TYPES)[number];

/** A hard cap on the carousel — more slides than this is a content problem, not a feature. */
export const MAX_HERO_SLIDES = 12;

/** The hero stage is a 16:9 box; anything else gets cropped when it renders. */
export const HERO_ASPECT_RATIO = 16 / 9;

/**
 * How far from exactly 16:9 a file may sit before the admin warns about it.
 * 2% covers the usual rounding (1920×1080 is exact, but 1366×768 is 1.7786 —
 * off by ~0.03%, and plenty of stock exports land a pixel or two out) without
 * letting a 4:3 or square image through unremarked.
 */
export const HERO_ASPECT_RATIO_TOLERANCE = 0.02;

/**
 * Whether `width × height` is close enough to 16:9 to pass without a warning.
 * Non-positive dimensions mean "couldn't be measured" — treated as fine,
 * since warning about an unmeasurable file helps nobody.
 */
export function isHeroAspectRatio(width: number, height: number): boolean {
  if (width <= 0 || height <= 0) return true;
  const ratio = width / height;
  return (
    Math.abs(ratio - HERO_ASPECT_RATIO) / HERO_ASPECT_RATIO <=
    HERO_ASPECT_RATIO_TOLERANCE
  );
}

/** e.g. "1920×1080 (16:9)" / "1000×1000 (1:1)" — for the admin's ratio warning copy. */
export function formatAspectRatio(width: number, height: number): string {
  if (width <= 0 || height <= 0) return "không xác định";
  const divisor = greatestCommonDivisor(width, height);
  return `${width / divisor}:${height / divisor}`;
}

function greatestCommonDivisor(a: number, b: number): number {
  return b === 0 ? a : greatestCommonDivisor(b, a % b);
}
