import type { Metadata } from "next";
import { HeroSection } from "@/components/sections/HeroSection";
import { TaglineSection } from "@/components/sections/TaglineSection";
import { MarqueeSection } from "@/components/sections/MarqueeSection";
import { ProductShowcase } from "@/components/sections/ProductShowcase";
import { BrandStorySection } from "@/components/sections/BrandStorySection";
import { NewsBlogSection } from "@/components/sections/NewsBlogSection";
import { FaqSection } from "@/components/sections/FaqSection";
import ContactSection from "./contact/Contact";
import { heroSectionService } from "@/services/HeroSectionService";
import { blogPostService } from "@/services/BlogPostService";
import { beerService } from "@/services/BeerService";
import { brandStoryService } from "@/services/BrandStoryService";
import { toSlideItem } from "@/lib/utils/HeroSectionPresenter";
import { toNewsCardItem } from "@/lib/utils/BlogPostPresenter";
import { toShowcaseItem } from "@/lib/utils/BeerPresenter";
import { toBookChapters } from "@/lib/utils/BrandStoryPresenter";
import { buildHomeJsonLd, buildHomeMetadata } from "@/lib/seo";
import { faqFor } from "@/config/faq";

const NEWS_RAIL_SIZE = 10;

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildHomeMetadata(locale);
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;

  const [heroSlides, beers, brandStoryChapters, posts] = await Promise.all([
    heroSectionService
      .listPublishedSlides()
      .then((slides) =>
        slides.map((slide) => toSlideItem(slide, locale)).filter((item) => item !== null)
      )
      .catch(() => []),
    beerService
      .listShowcasePublished()
      .then((items) => items.map((beer) => toShowcaseItem(beer, locale)).filter((item) => item !== null))
      .catch(() => []),
    brandStoryService
      .getPublished()
      .then((brandStory) => toBookChapters(brandStory, locale))
      .catch(() => []),
    blogPostService
      .getRecentPublished(NEWS_RAIL_SIZE)
      .then((items) =>
        items.map((post) => toNewsCardItem(post, locale)).filter((item) => item !== null)
      )
      .catch(() => []),
  ]);


  const faq = faqFor(locale);

  /**
   * One schema.org `@graph` for the whole page: Organization, WebSite,
   * Brewery (NAP + hours + geo), a Product per beer with its ABV/IBU, and the
   * FAQPage mirroring the visible FaqSection.
   *
   * Rendered server-side, so it is present for crawlers and answer engines
   * that never execute the page's JavaScript — which is most of the beer copy
   * on this page, since the showcase and the brand-story flipbook are both
   * client components.
   */
  const jsonLd = buildHomeJsonLd(locale, beers, faq);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <HeroSection locale={locale} slides={heroSlides} />
      <BrandStorySection locale={locale} chapters={brandStoryChapters} />
      <MarqueeSection locale={locale} />
      <TaglineSection locale={locale} />
      {beers.length > 0 ? <ProductShowcase locale={locale} beers={beers} /> : null}
      {posts.length > 0 ? <NewsBlogSection locale={locale} posts={posts} /> : null}
      <FaqSection locale={locale} />
      {/* The page's single <h1> lives in HeroSection, so the contact block
          renders at h2 here — on /contact it keeps its own h1. */}
      <ContactSection locale={locale} headingLevel="h2" />
    </>
  );
}
