import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { SUPPORTED_LOCALE_CODES } from "@/config/locales";
import { localizedPath, staticAlternates } from "@/lib/seo";
import { blogPostService } from "@/services/BlogPostService";

const MAX_SITEMAP_POSTS = 5000;

/**
 * Every static marketing route, with the crawl hints that tell Google how
 * often to come back. `/` and `/blog` were the only two entries before —
 * /contact, /privacy and /terms were reachable but never announced.
 *
 * Utility pages (/age-verification, /design-system) are deliberately absent:
 * they are `noindex` and disallowed in robots.ts, and listing a page you have
 * asked not to be indexed is a conflicting signal.
 */
const STATIC_ROUTES: readonly {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/menu", priority: 0.9, changeFrequency: "weekly" },
  { path: "/about", priority: 0.9, changeFrequency: "monthly" },
  { path: "/blog", priority: 0.8, changeFrequency: "weekly" },
  { path: "/contact", priority: 0.7, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = SUPPORTED_LOCALE_CODES.flatMap(
    (locale) =>
      STATIC_ROUTES.map((route) => ({
        url: `${siteUrl}${localizedPath(locale, route.path)}`,
        lastModified: now,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        // Declaring the language alternates inside the sitemap (not only via
        // <link rel="alternate">) is Google's documented way to make sure both
        // locales of a page are discovered together and treated as one
        // clustered result rather than as duplicates competing with each other.
        alternates: { languages: staticAlternates(route.path) },
      }))
  );

  try {
    const { items: posts } = await blogPostService.listPublished({
      page: 1,
      pageSize: MAX_SITEMAP_POSTS,
    });

    const postEntries: MetadataRoute.Sitemap = posts.flatMap((post) =>
      post.translations.map((translation) => ({
        url: `${siteUrl}${localizedPath(translation.locale, `/blog/${translation.slug}`)}`,
        lastModified: post.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.6,
        // Per-post alternates key each locale to that language's own slug —
        // the slugs differ between translations, so this cannot reuse
        // staticAlternates.
        alternates: {
          languages: Object.fromEntries(
            post.translations.map((t) => [
              t.locale,
              `${siteUrl}${localizedPath(t.locale, `/blog/${t.slug}`)}`,
            ])
          ),
        },
      }))
    );

    return [...staticEntries, ...postEntries];
  } catch {
    return staticEntries;
  }
}
