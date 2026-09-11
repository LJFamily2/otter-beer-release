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

export const DEFAULT_HERO_SLIDES: Record<string, HeroSlideItem[]> = {
  vi: [
    {
      src: "/images/otter-beer-logo-yellow-bg.png",
      alt: "Lon bia thủ công Otter Beer trên nền tối — dòng bia chủ lực nấu tại Tây Ninh",
      mediaType: "image",
    },
    {
      src: "/images/new-bg.png",
      alt: "Bia Otter Beer Premium Lager rót ra ly, bọt mịn, màu vàng hổ phách",
      mediaType: "image",
    },
    {
      src: "/images/contact-hero.jpg",
      alt: "Không gian taproom của nhà máy bia Otter Beer tại Tây Ninh",
      mediaType: "image",
    },
    {
      src: "/images/age-verification-bg.jpg",
      alt: "Mạch nha vàng và hoa bia Saaz — nguyên liệu nấu bia thủ công Otter Beer",
      mediaType: "image",
    },
  ],
  en: [
    {
      src: "/images/otter-beer-logo-yellow-bg.png",
      alt: "Otter Beer craft beer can on dark background — flagship brew from Tay Ninh",
      mediaType: "image",
    },
    {
      src: "/images/new-bg.png",
      alt: "Poured glass of Otter Beer Premium Lager with fine foam and amber color",
      mediaType: "image",
    },
    {
      src: "/images/contact-hero.jpg",
      alt: "Otter Beer taproom and brewery space in Tay Ninh",
      mediaType: "image",
    },
    {
      src: "/images/age-verification-bg.jpg",
      alt: "Golden malt and Saaz hops — Otter Beer craft brewing ingredients",
      mediaType: "image",
    },
  ],
};


