import type { Metadata } from "next";
import { env } from "@/lib/env";
import { publicImageUrl } from "@/lib/storage/constants";
import { DEFAULT_LOCALE, SUPPORTED_LOCALE_CODES } from "@/config/locales";
import {
  ADDRESS,
  BRAND_NAME,
  CONTACT,
  FOUNDING_YEAR,
  GEO,
  KEYWORDS,
  LEGAL_NAME,
  OPENING_HOURS,
  PRICE_RANGE,
  SOCIAL_PROFILES,
} from "@/config/brand";
import type { IBlogPost, IBlogPostTranslation } from "@/models/BlogPost";
import type { BeerShowcaseItem } from "@/lib/utils/BeerPresenter";

/**
 * Default social-share image — a real 1200x630 card.
 *
 * This used to point at otter-beer-hero.png, which is 1024x1024, while every
 * `openGraph.images` entry below declared `width: 1200, height: 630`. Facebook,
 * X and Zalo all trust the declared dimensions, so every shared link rendered
 * a mis-cropped or rejected preview. Regenerate with
 * `node scripts/generate-og-image.mjs` if the source art changes.
 */
export const OG_IMAGE_PATH = "/images/otter-beer-og.png";

/** The OG card's true pixel dimensions. Declared here so metadata cannot lie about them again. */
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
/** Square-ish brand mark used as the Organization `logo`. */
export const LOGO_PATH = "/images/otter-beer-logo-yellow-bg.png";

export function siteUrl(): string {
  return env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
}

/** vi (default) has no prefix; every other locale is /{locale}/... */
export function localizedPath(locale: string, path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return locale === DEFAULT_LOCALE ? cleanPath : `/${locale}${cleanPath}`;
}

export function absoluteUrl(locale: string, path: string): string {
  return `${siteUrl()}${localizedPath(locale, path)}`;
}

/** hreflang alternates for every language a post actually has, keyed by locale -> that language's own slug. */
function hreflangAlternates(
  post: Pick<IBlogPost, "translations">,
  buildPath: (slug: string) => string
): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of SUPPORTED_LOCALE_CODES) {
    const translation = post.translations.find((t) => t.locale === locale);
    if (translation) {
      languages[locale] = absoluteUrl(locale, buildPath(translation.slug));
    }
  }
  return languages;
}

export function buildBlogListMetadata(locale: string): Metadata {
  const isVi = locale === "vi";
  const title = isVi
    ? "Nhật ký bia chú rái cá — Tin tức & Blog"
    : "Otter Beer Journal — News & Blog";
  const description = isVi
    ? "Câu chuyện từ vùng biển, cập nhật từ nhà máy bia, và những góc nhìn sâu về quy trình chế biến của chúng tôi."
    : "Tales from the coastal waters, brewery updates, and deep dives into our crafting process.";
  // Delegates to the shared builder so the blog list picks up the same
  // x-default hreflang, absolute OG image and locale tag as every other page —
  // it previously hand-rolled a shorter version of all three.
  return buildStaticPageMetadata({ locale, path: "/blog", title, description });
}

export function buildBlogPostMetadata(
  post: IBlogPost,
  locale: string,
  translation: IBlogPostTranslation
): Metadata {
  const title = translation.seoTitle || translation.title;
  const description = translation.seoDescription || translation.excerpt;
  const canonical = absoluteUrl(locale, `/blog/${translation.slug}`);
  const imageKey = translation.ogImageKey || post.coverImageKey;
  const images = imageKey ? [{ url: publicImageUrl(imageKey) }] : undefined;

  return {
    title,
    description,
    keywords: translation.seoKeywords.length
      ? translation.seoKeywords
      : undefined,
    alternates: {
      canonical,
      languages: hreflangAlternates(post, (slug) => `/blog/${slug}`),
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
      siteName: "Otter Beer",
      images,
      publishedTime: post.publishedAt?.toISOString(),
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title,
      description,
      images: images?.map((i) => i.url),
    },
  };
}

/** schema.org BlogPosting JSON-LD — render as a <script type="application/ld+json"> in the page. */
export function buildArticleJsonLd(
  post: IBlogPost,
  locale: string,
  translation: IBlogPostTranslation,
  authorName: string
): Record<string, unknown> {
  const imageKey = translation.ogImageKey || post.coverImageKey;

  return {
    "@type": "BlogPosting",
    "@id": `${absoluteUrl(locale, `/blog/${translation.slug}`)}#article`,
    headline: translation.title,
    description: translation.excerpt,
    image: imageKey ? [publicImageUrl(imageKey)] : undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    inLanguage: locale,
    author: {
      "@type": "Person",
      name: authorName,
      // Ties the byline to the publishing organisation. An author with no
      // affiliation is a weak E-E-A-T signal; an author attached to a named
      // brewery is a checkable one.
      affiliation: { "@id": organizationId() },
    },
    // References the Organization node rather than restating it, so the
    // brewery is one entity across the site instead of a new anonymous
    // publisher on every post.
    publisher: { "@id": organizationId() },
    isPartOf: { "@id": websiteId() },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(locale, `/blog/${translation.slug}`),
    },
    keywords: translation.seoKeywords.length
      ? translation.seoKeywords.join(", ")
      : undefined,
  };
}

/* ------------------------------------------------------------------ *
 * Static-page metadata
 * ------------------------------------------------------------------ */

/**
 * hreflang map for a path that exists in every supported locale (unlike a blog
 * post, which only has the languages an editor actually translated).
 *
 * `x-default` points at the Vietnamese original: it is the version to serve a
 * user whose language we have no better match for, and omitting it is one of
 * the most common international-SEO mistakes.
 */
export function staticAlternates(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of SUPPORTED_LOCALE_CODES) {
    languages[locale] = absoluteUrl(locale, path);
  }
  languages["x-default"] = absoluteUrl(DEFAULT_LOCALE, path);
  return languages;
}

interface StaticPageMetadataInput {
  locale: string;
  path: string;
  title: string;
  description: string;
  keywords?: readonly string[];
  /** Utility pages (age gate, design system) should stay out of the index. */
  noIndex?: boolean;
  imagePath?: string;
  /**
   * Bypass the root layout's `%s | Otter Beer` template. Use it when the title
   * already contains the brand, otherwise it renders twice
   * ("Otter Beer — Bia Thủ Công Tây Ninh | Otter Beer") and eats the ~60
   * characters Google actually shows.
   */
  absoluteTitle?: boolean;
}

/**
 * The metadata every non-blog page shares: canonical, full hreflang set,
 * OpenGraph and Twitter cards with a real absolute image.
 *
 * Canonical + hreflang is what stops the `/` and `/en` versions of a page from
 * competing with each other for the same query.
 */
export function buildStaticPageMetadata({
  locale,
  path,
  title,
  description,
  keywords,
  noIndex,
  imagePath = OG_IMAGE_PATH,
  absoluteTitle = false,
}: StaticPageMetadataInput): Metadata {
  const canonical = absoluteUrl(locale, path);
  const image = `${siteUrl()}${imagePath}`;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    keywords: keywords?.length ? [...keywords] : undefined,
    alternates: { canonical, languages: staticAlternates(path) },
    robots: noIndex ? { index: false, follow: true } : undefined,
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      siteName: BRAND_NAME,
      locale: locale === "vi" ? "vi_VN" : "en_US",
      images: [
        { url: image, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT, alt: title },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

/** Homepage title/description — the single highest-value snippet on the site. */
export function buildHomeMetadata(locale: string): Metadata {
  const isVi = locale === "vi";

  return buildStaticPageMetadata({
    locale,
    path: "/",
    // Front-loads the head keyword, names the place, and stays inside the
    // ~60 characters Google renders before truncating.
    title: isVi
      ? "Otter Beer — Bia Thủ Công Tây Ninh"
      : "Otter Beer — Craft Beer Brewed in Tay Ninh, Vietnam",
    description: isVi
      ? `Otter Beer là thương hiệu bia thủ công của ${LEGAL_NAME} tại Tây Ninh, nấu từ 100% mạch nha vàng, nước suối Tây Ninh và hoa bia Saaz tuyển chọn. Khám phá các dòng bia, thông số ABV/IBU và nơi mua.`
      : `Otter Beer is a Tay Ninh craft brewery by ${LEGAL_NAME}, brewing with 100% golden malt, Tay Ninh spring water and select Saaz hops. Explore our beers, ABV/IBU specs and where to buy.`,
    keywords: isVi ? KEYWORDS.vi : KEYWORDS.en,
    absoluteTitle: true,
  });
}

/* ------------------------------------------------------------------ *
 * schema.org structured data
 *
 * Everything below is emitted as ONE `@graph` per page (see buildHomeJsonLd).
 * A graph with stable `@id`s lets the nodes reference each other — the WebSite
 * says who publishes it, each Product says who brews it — which is what turns
 * a pile of disconnected snippets into a single recognisable entity for both
 * Google's Knowledge Graph and LLM answer engines.
 * ------------------------------------------------------------------ */

export function organizationId(): string {
  return `${siteUrl()}/#organization`;
}
export function websiteId(): string {
  return `${siteUrl()}/#website`;
}
export function breweryId(): string {
  return `${siteUrl()}/#brewery`;
}

/** The publisher entity. Referenced by every other node in the graph. */
export function buildOrganizationJsonLd(): Record<string, unknown> {
  return {
    "@type": "Organization",
    "@id": organizationId(),
    name: BRAND_NAME,
    legalName: LEGAL_NAME,
    url: siteUrl(),
    logo: {
      "@type": "ImageObject",
      url: `${siteUrl()}${LOGO_PATH}`,
    },
    foundingDate: FOUNDING_YEAR,
    email: CONTACT.email,
    telephone: CONTACT.phones[0],
    address: {
      "@type": "PostalAddress",
      ...ADDRESS,
    },
    contactPoint: CONTACT.phones.map((telephone) => ({
      "@type": "ContactPoint",
      telephone,
      contactType: "customer service",
      areaServed: "VN",
      availableLanguage: ["vi", "en"],
    })),
    sameAs: SOCIAL_PROFILES.length ? [...SOCIAL_PROFILES] : undefined,
  };
}

/**
 * The site entity, plus the `SearchAction` that makes Google's sitelinks
 * search box eligible and tells crawlers how to query the blog.
 */
export function buildWebSiteJsonLd(locale: string): Record<string, unknown> {
  return {
    "@type": "WebSite",
    "@id": websiteId(),
    url: siteUrl(),
    name: BRAND_NAME,
    inLanguage: locale,
    publisher: { "@id": organizationId() },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl(locale, "/blog")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * SiteNavigationElement schema explicitly feeds Google the links we want shown as Sitelinks.
 */
export function buildSiteNavigationJsonLd(locale: string): Record<string, unknown> {
  const isVi = locale === "vi";
  return {
    "@type": "ItemList",
    "@id": `${siteUrl()}/#sitenavigation`,
    itemListElement: [
      {
        "@type": "SiteNavigationElement",
        position: 1,
        name: isVi ? "Sản phẩm" : "Products",
        url: absoluteUrl(locale, "/menu"),
      },
      {
        "@type": "SiteNavigationElement",
        position: 2,
        name: isVi ? "Câu chuyện" : "Our Story",
        url: absoluteUrl(locale, "/about"),
      },
      {
        "@type": "SiteNavigationElement",
        position: 3,
        name: isVi ? "Tin tức" : "News",
        url: absoluteUrl(locale, "/blog"),
      },
      {
        "@type": "SiteNavigationElement",
        position: 4,
        name: isVi ? "Liên hệ" : "Contact",
        url: absoluteUrl(locale, "/contact"),
      },
    ],
  };
}

/**
 * The physical brewery/taproom. `Brewery` is a `LocalBusiness` subtype, so this
 * one node covers "brewery near me" local-pack eligibility, the map/NAP panel,
 * and the "where are they / when are they open" answer.
 */
export function buildBreweryJsonLd(locale: string): Record<string, unknown> {
  return {
    "@type": "Brewery",
    "@id": breweryId(),
    name: BRAND_NAME,
    legalName: LEGAL_NAME,
    url: siteUrl(),
    image: `${siteUrl()}${OG_IMAGE_PATH}`,
    logo: `${siteUrl()}${LOGO_PATH}`,
    telephone: CONTACT.phones[0],
    email: CONTACT.email,
    priceRange: PRICE_RANGE,
    currenciesAccepted: "VND",
    foundingDate: FOUNDING_YEAR,
    address: { "@type": "PostalAddress", ...ADDRESS },
    geo: { "@type": "GeoCoordinates", ...GEO },
    openingHours: [...OPENING_HOURS],
    parentOrganization: { "@id": organizationId() },
    sameAs: SOCIAL_PROFILES.length ? [...SOCIAL_PROFILES] : undefined,
    hasMap: absoluteUrl(locale, "/contact"),
  };
}

/**
 * One `Product` node per beer on the showcase, carrying the ABV/IBU specs as
 * `additionalProperty`. Those numbers are exactly the kind of concrete,
 * checkable fact an answer engine lifts into a reply about a beer, and they
 * are otherwise locked inside a client-side carousel.
 */
export function buildBeerProductsJsonLd(
  beers: readonly BeerShowcaseItem[]
): Record<string, unknown>[] {
  return beers.map((beer) => ({
    "@type": "Product",
    "@id": `${siteUrl()}/#beer-${beer.id}`,
    name: beer.headline.replace(/\s+/g, " ").trim(),
    category: beer.style,
    description: beer.description.replace(/\s+/g, " ").trim(),
    image: beer.imageSrc.startsWith("http")
      ? beer.imageSrc
      : `${siteUrl()}${beer.imageSrc}`,
    brand: { "@id": organizationId() },
    manufacturer: { "@id": organizationId() },
    additionalProperty: [
      { "@type": "PropertyValue", name: "ABV", value: beer.abv },
      { "@type": "PropertyValue", name: "IBU", value: String(beer.ibu) },
      { "@type": "PropertyValue", name: "Style", value: beer.style },
    ],
  }));
}

export interface FaqEntry {
  question: string;
  answer: string;
}

/**
 * `FAQPage` — the highest-leverage AEO markup there is. It hands an answer
 * engine a pre-parsed question/answer pair instead of asking it to infer one
 * from prose.
 */
export function buildFaqJsonLd(
  locale: string,
  entries: readonly FaqEntry[]
): Record<string, unknown> {
  return {
    "@type": "FAQPage",
    "@id": `${absoluteUrl(locale, "/")}#faq`,
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
    })),
  };
}

export interface BreadcrumbEntry {
  name: string;
  path: string;
}

/**
 * Maps a breadcrumb trail into the shape `<Breadcrumbs>` renders.
 *
 * Exists so a page can declare its trail ONCE and feed it to both
 * `buildBreadcrumbJsonLd` and the visible component. The site previously
 * emitted BreadcrumbList JSON-LD on /contact, /blog and /blog/[slug] while
 * rendering no visible trail at all — Google's structured-data guidelines
 * require breadcrumb markup to reflect a breadcrumb a user can actually see,
 * so the markup was both a UX gap and a validity risk.
 *
 * The last entry is intentionally left without an href: `Breadcrumbs` renders
 * the final item as the current page regardless, and omitting it keeps the
 * "don't link to where you already are" rule visible at the call site.
 */
export function toBreadcrumbItems(
  locale: string,
  trail: readonly BreadcrumbEntry[]
): { label: string; href?: string }[] {
  return trail.map((entry, index) => ({
    label: entry.name,
    href: index === trail.length - 1 ? undefined : localizedPath(locale, entry.path),
  }));
}

/** `BreadcrumbList` — drives the path shown in place of a raw URL in results. */
export function buildBreadcrumbJsonLd(
  locale: string,
  trail: readonly BreadcrumbEntry[]
): Record<string, unknown> {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: absoluteUrl(locale, entry.path),
    })),
  };
}

/**
 * Wraps nodes into the single `@context` + `@graph` document a page renders.
 * Null/undefined members are dropped so an unset optional never ships as a
 * dangling node, which validators flag.
 */
export function jsonLdGraph(
  nodes: readonly (Record<string, unknown> | null | undefined)[]
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@graph": nodes.filter(Boolean),
  };
}

/** The full homepage graph: publisher, site, brewery, products, FAQ. */
export function buildHomeJsonLd(
  locale: string,
  beers: readonly BeerShowcaseItem[],
  faq: readonly FaqEntry[]
): Record<string, unknown> {
  return jsonLdGraph([
    buildOrganizationJsonLd(),
    buildWebSiteJsonLd(locale),
    buildSiteNavigationJsonLd(locale),
    buildBreweryJsonLd(locale),
    ...buildBeerProductsJsonLd(beers),
    faq.length ? buildFaqJsonLd(locale, faq) : null,
  ]);
}

/**
 * The blog-post page graph. The BlogPosting alone used to ship with an inline
 * anonymous publisher; wrapping it with the real Organization and WebSite
 * nodes means the `{ "@id": ... }` references it makes actually resolve on the
 * page, and a breadcrumb trail replaces the raw URL in the result.
 */
/**
 * The Home > News > {post} trail. Shared by `buildBlogPostJsonLd` and the
 * visible <Breadcrumbs> on the post page so the markup describes a trail the
 * reader can actually see, which is what Google's guidelines require.
 */
export function blogPostBreadcrumbTrail(
  homeLabel: string,
  blogLabel: string,
  title: string,
  slug: string
): BreadcrumbEntry[] {
  return [
    { name: homeLabel, path: "/" },
    { name: blogLabel, path: "/blog" },
    { name: title, path: `/blog/${slug}` },
  ];
}

export function buildBlogPostJsonLd(
  post: IBlogPost,
  locale: string,
  translation: IBlogPostTranslation,
  authorName: string,
  blogLabel: string,
  homeLabel: string
): Record<string, unknown> {
  return jsonLdGraph([
    buildOrganizationJsonLd(),
    buildWebSiteJsonLd(locale),
    buildArticleJsonLd(post, locale, translation, authorName),
    buildBreadcrumbJsonLd(
      locale,
      blogPostBreadcrumbTrail(
        homeLabel,
        blogLabel,
        translation.title,
        translation.slug
      )
    ),
  ]);
}
