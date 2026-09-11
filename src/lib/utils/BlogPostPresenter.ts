import { DEFAULT_LOCALE } from "@/config/locales";
import { localizedPath } from "@/lib/seo";
import { publicMediaUrl } from "@/lib/storage/constants";
import type { IBlogPost, IBlogPostTranslation } from "@/models/BlogPost";

/**
 * Picks the translation to render for a given locale, falling back to the
 * default locale (Vietnamese is required on every post) and then to
 * whatever exists — English is optional, so a vi-only post must still
 * render on the /en tree instead of disappearing.
 */
export function pickTranslation(
  post: Pick<IBlogPost, "translations">,
  locale: string
): IBlogPostTranslation | null {
  return (
    post.translations.find((t) => t.locale === locale) ??
    post.translations.find((t) => t.locale === DEFAULT_LOCALE) ??
    post.translations[0] ??
    null
  );
}


/** Plain, serializable shape NewsBlogSection (a Client Component) can receive as a prop. */
export interface NewsCardItem {
  id: string;
  imageSrc: string;
  title: string;
  /** The post's first tag, verbatim — tags are locale-agnostic across the app (see the public /blog list). Omitted when the post has none. */
  tag?: string;
  href: string;
}

/**
 * Maps a published BlogPost to the plain shape NewsBlogSection's rail
 * renders. Returns null when the post has no usable translation for any
 * locale, or when it has no cover image (data integrity guard — a card
 * without an image is not renderable).
 */
export function toNewsCardItem(post: IBlogPost, locale: string): NewsCardItem | null {
  const translation = pickTranslation(post, locale);
  if (!translation) return null;
  if (!post.coverImageKey) return null;

  return {
    id: String(post._id),
    imageSrc: publicMediaUrl(post.coverImageKey),
    title: translation.title,
    tag: post.tags[0],
    href: localizedPath(locale, `/blog/${translation.slug}`),
  };
}



