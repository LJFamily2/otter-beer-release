import { DEFAULT_LOCALE } from "@/config/locales";
import { DEFAULT_THEME_COLOR, DEFAULT_THEME_COLOR_CONTAINER } from "@/config/beer";
import { publicImageUrl } from "@/lib/storage/constants";
import type { IBeer, IBeerTranslation, IBeerVariant } from "@/models/Beer";


/**
 * Picks the translation to render for a given locale, falling back to the
 * default locale (Vietnamese is required on every beer) and then to
 * whatever exists — mirrors BlogPostPresenter.pickTranslation.
 */
export function pickTranslation(
  beer: Pick<IBeer, "translations">,
  locale: string
): IBeerTranslation | null {
  return (
    beer.translations.find((t) => t.locale === locale) ??
    beer.translations.find((t) => t.locale === DEFAULT_LOCALE) ??
    beer.translations[0] ??
    null
  );
}

/**
 * Picks a variant's label for a locale using the same fallback ladder as
 * pickTranslation — exact locale, then the default locale, then whatever
 * exists.
 */
export function pickVariantName(
  variant: Pick<IBeerVariant, "names">,
  locale: string
): string | null {
  // Tolerates a variant with no names array at all: dropping one unlabelled
  // pill beats throwing while rendering the public homepage.
  const names = variant.names ?? [];
  const name =
    names.find((n) => n.locale === locale) ??
    names.find((n) => n.locale === DEFAULT_LOCALE) ??
    names[0] ??
    null;
  return name?.shortName ?? null;
}

/** One product variant as rendered by the showcase's pill picker. */
export interface BeerVariantItem {
  shortName: string;
  imageSrc: string;
}

/** Plain, serializable shape ProductShowcase (a Client Component) can receive as a prop. */
export interface BeerShowcaseItem {
  id: string;
  abv: string;
  ibu: number;
  imageSrc: string;
  style: string;
  headline: string;
  description: string;
  shopUrl?: string;
  findLocallyUrl?: string;
  themeColor: string;
  themeColorContainer: string;
  /**
   * The picker's pills: the main image first, then each variant. Empty for
   * beers with no variants, in which case the showcase renders `imageSrc`
   * and hides the picker entirely.
   */
  variants: BeerVariantItem[];
}

/**
 * Maps a published Beer document to the plain shape ProductShowcase renders.
 * Returns null when the beer has no usable translation for any locale (data
 * integrity guard — translations is required to have at least one entry at
 * the schema level, so this should not happen for a saved beer).
 */
/**
 * The picker's pills, in display order: the beer's main image first, then
 * each variant. Returns an empty list when the beer has no variants — there
 * is nothing to switch between, so the showcase renders the main image with
 * no picker at all.
 */
function buildVariantItems(
  beer: IBeer,
  translation: IBeerTranslation,
  locale: string,
  mainImageSrc: string
): BeerVariantItem[] {
  const variants = beer.variants ?? [];
  if (variants.length === 0) return [];

  const items: BeerVariantItem[] = [
    {
      // The label is required once variants exist, so this normally comes
      // from imageNames; `style` is a defensive fallback that keeps the main
      // image in the row (and therefore selected by default) even if a
      // document predates that rule.
      shortName:
        pickVariantName({ names: beer.imageNames ?? [] }, locale) ?? translation.style,
      imageSrc: mainImageSrc,
    },
  ];

  for (const variant of variants) {
    const shortName = pickVariantName(variant, locale);
    // A variant with no usable label is unrenderable (the pill would be
    // blank), so it is dropped rather than shown as an empty button.
    if (!shortName || !variant.imageKey) continue;
    items.push({ shortName, imageSrc: publicImageUrl(variant.imageKey) });
  }

  return items;
}

export function toShowcaseItem(beer: IBeer, locale: string): BeerShowcaseItem | null {
  const translation = pickTranslation(beer, locale);
  if (!translation) return null;
  if (!beer.imageKey) return null;

  const mainImageSrc = publicImageUrl(beer.imageKey);

  return {
    id: String(beer._id),
    abv: `${beer.abv}%`,
    ibu: beer.ibu,
    imageSrc: mainImageSrc,
    style: translation.style,
    headline: translation.headline,
    description: translation.description,
    shopUrl: beer.shopUrl,
    findLocallyUrl: beer.findLocallyUrl,
    themeColor: beer.themeColor ?? DEFAULT_THEME_COLOR,
    themeColorContainer: beer.themeColorContainer ?? DEFAULT_THEME_COLOR_CONTAINER,
    variants: buildVariantItems(beer, translation, locale, mainImageSrc),
  };
}
