/**
 * Single source of truth for the brand's real-world facts (NAP, socials,
 * founding, product framing).
 *
 * Everything here is emitted verbatim into schema.org JSON-LD, so it is the
 * data search engines and LLM answer engines quote back about Otter Beer.
 * Keep it factual and keep it in sync with what the Contact section renders —
 * a NAP mismatch between visible text and structured data is the most common
 * cause of a local-SEO trust penalty.
 *
 * @see src/lib/seo.ts for the JSON-LD builders that consume this.
 */

/** Legal operating entity behind the Otter Beer brand. */
export const LEGAL_NAME = "BADENBEER Co., Ltd.";

export const BRAND_NAME = "Otter Beer";

/** Year the brewery started operating — rendered in TaglineSection too. */
export const FOUNDING_YEAR = "2024";

export const CONTACT = {
  email: "hello@otterbeer.vn",
  /** E.164, the format schema.org and Google expect. */
  phones: ["+84908790102", "+84981686491"],
  /** Human-readable rendering of the same numbers, for visible copy. */
  phonesDisplay: ["(+84) 908 790 102", "(+84) 981 686 491"],
} as const;

/**
 * PostalAddress fields. `streetAddress` matches the Contact section's visible
 * address string exactly (see Contact.tsx COPY.address).
 */
export const ADDRESS = {
  streetAddress: "13 House, Alley 30, Lac Long Quan Street, Hiep Dinh Ward",
  addressLocality: "Tay Ninh",
  addressRegion: "Tay Ninh Province",
  addressCountry: "VN",
} as const;

/**
 * Brewery coordinates — powers the `geo` node on the Brewery schema AND the
 * GPS badge rendered in the Contact section.
 *
 * These two used to be separate literals that had drifted apart: the schema
 * said 11.3254/106.0967 while the visible badge said 11.3385/106.1144, which
 * is a different spot entirely. The visible pair is the correct one — it is
 * where the embedded Google Map is actually pinned — and a NAP/geo mismatch
 * between visible text and structured data is exactly the local-SEO trust
 * problem this file's header warns about. Single source now; render the badge
 * from `formatGeo()` rather than retyping the numbers.
 */
export const GEO = {
  latitude: 11.3385,
  longitude: 106.1144,
} as const;

/**
 * The GPS badge string, per locale, derived from GEO so it can never drift
 * from the coordinates the structured data publishes.
 */
export function formatGeo(locale: string): string {
  const isVi = locale === "vi";
  const ns = isVi ? "B" : "N";
  const ew = isVi ? "Đ" : "E";
  return `${GEO.latitude.toFixed(4)}° ${ns}, ${GEO.longitude.toFixed(4)}° ${ew}`;
}

/**
 * Profiles that prove this is the same real-world entity across the web.
 * `sameAs` is the strongest entity-disambiguation signal there is — both for
 * Google's Knowledge Graph and for LLMs deciding whether two mentions of
 * "Otter Beer" are the same brewery.
 *
 * Add real profile URLs as they go live; empty entries are filtered out by
 * the JSON-LD builders rather than emitted as dead links.
 */
export const SOCIAL_PROFILES: readonly string[] = [
  "https://facebook.com/otterbeer",
  "https://instagram.com/otterbeer",
];

/**
 * Google Maps deep link behind the Contact section's "Get Directions" button.
 *
 * Built from GEO rather than from an address string. The previous value was a
 * free-text `?q=` query that (a) had a typo — "Hẹm" for "hẻm" — and (b) left
 * Google to guess which of several similar Tay Ninh addresses was meant. That
 * was tolerable while nothing rendered the link; now that it is a button a
 * visitor taps to drive to the brewery, a fuzzy match is a wrong turn.
 *
 * Coordinates route to the exact pin, and deriving them here means the button,
 * the GPS badge and the Brewery JSON-LD's `geo` can never disagree.
 */
export const MAP_URL = `https://www.google.com/maps/dir/?api=1&destination=${GEO.latitude},${GEO.longitude}`;

/**
 * Taproom hours in schema.org `openingHours` shorthand. Drives the
 * "when are you open" answer in both rich results and LLM answers.
 */
export const OPENING_HOURS = ["Mo-Su 10:00-22:00"] as const;

export const PRICE_RANGE = "$ ";


/**
 * The head keyword set for the site, per locale. These land in the homepage
 * `keywords` metadata and shape the copy the AEO/GEO sections are written
 * around — they are the queries this site is trying to be the answer to.
 */
export const KEYWORDS = {
  vi: [
    "bia thủ công",
    "bia thủ công Tây Ninh",
    "Otter Beer",
    "bia craft Việt Nam",
    "nhà máy bia Tây Ninh",
    "bia tươi Tây Ninh",
    "premium lager Việt Nam",
    "mua bia thủ công",
    "BADENBEER",
  ],
  en: [
    "craft beer",
    "Vietnamese craft beer",
    "Otter Beer",
    "Tay Ninh brewery",
    "craft brewery Vietnam",
    "premium lager Vietnam",
    "buy craft beer Vietnam",
    "BADENBEER",
  ],
} as const;
