/**
 * Lives outside src/models/Beer.ts (which pulls in the full Mongoose +
 * MongoDB driver chain) so the validation layer — and its unit tests — can
 * depend on just the status enum without loading Mongoose.
 */
export const BEER_STATUSES = ["draft", "published"] as const;
export type BeerStatus = (typeof BEER_STATUSES)[number];

/** Applied on the homepage showcase when a beer has no themeColor/themeColorContainer set. */
export const DEFAULT_THEME_COLOR = "#002867";
export const DEFAULT_THEME_COLOR_CONTAINER = "#1d3f82";
