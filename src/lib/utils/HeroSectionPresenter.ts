import { DEFAULT_LOCALE } from "@/config/locales";
import { publicMediaUrl } from "@/lib/storage/constants";
import type { HeroMediaType, IHeroSlide, IHeroSlideTranslation } from "@/models/HeroSection";

/**
 * Picks the translation to render for a given locale, falling back to the
 * default locale (Vietnamese is required on every slide) and then to
 * whatever exists — mirrors BeerPresenter.pickTranslation.
 */
export function pickTranslation(
  slide: Pick<IHeroSlide, "translations">,
  locale: string
): IHeroSlideTranslation | null {
  return (
    slide.translations.find((t) => t.locale === locale) ??
    slide.translations.find((t) => t.locale === DEFAULT_LOCALE) ??
    slide.translations[0] ??
    null
  );
}

/** Plain, serializable shape HeroSection (a Client Component) can receive as a prop. */
export interface HeroSlideItem {
  src: string;
  mobileSrc?: string;
  alt: string;
  mediaType: HeroMediaType;
}

/**
 * Maps a published hero slide to the plain shape HeroSection renders.
 * Returns null when the slide has no usable translation for any locale (data
 * integrity guard — translations is required to have at least one entry at
 * the schema level, so this should not happen for a saved slide).
 */
export function toSlideItem(slide: IHeroSlide, locale: string): HeroSlideItem | null {
  const translation = pickTranslation(slide, locale);
  if (!translation) return null;

  return {
    src: publicMediaUrl(slide.mediaKey),
    mobileSrc: slide.mobileMediaKey ? publicMediaUrl(slide.mobileMediaKey) : undefined,
    alt: translation.alt,
    mediaType: slide.mediaType,
  };
}



