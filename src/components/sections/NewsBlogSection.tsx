"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Playfair_Display } from "next/font/google";
import { motion, useScroll, useTransform } from "framer-motion";
import { DEFAULT_LOCALE } from "@/config/locales";
import { localizedPath } from "@/lib/seo";
import type { NewsCardItem } from "@/lib/utils/BlogPostPresenter";

const playfair = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  style: ["italic", "normal"],
  weight: ["500", "600"],
  display: "swap",
});

interface NewsBlogSectionProps {
  locale?: string;
  /** Only render this section when there is at least one post — a scroll-linked
   *  parallax effect is bound to the section's own root, so an empty render
   *  (never mounting that root) breaks it. Callers gate on posts.length, same
   *  as ProductShowcase gates on beers.length. */
  posts: NewsCardItem[];
}

const COPY = {
  vi: {
    kicker: "TIN TỨC & BLOG",
    heading: "NHẬT KÝ BIA CHÚ RÁI CÁ",
    viewAll: "XEM TẤT CẢ BÀI VIẾT",
    prev: "Bài viết trước",
    next: "Bài viết tiếp theo",
    swipeHint: "Vuốt để xem thêm bài viết",
    sectionLabel: "Tin tức và blog",
    railLabel: "Danh sách bài viết nổi bật",
  },
  en: {
    kicker: "NEWS & BLOG",
    heading: "OTTER BEER JOURNAL",
    viewAll: "VIEW ALL STORIES",
    prev: "Previous story",
    next: "Next story",
    swipeHint: "Swipe to read more stories",
    sectionLabel: "News and blog",
    railLabel: "Featured stories carousel",
  },
} as const;

/** How far a single arrow click nudges the rail when a card can't be measured. */
const FALLBACK_SCROLL_RATIO = 0.8;
const CARD_GAP_PX = 20;

export function NewsBlogSection({ locale = DEFAULT_LOCALE, posts }: NewsBlogSectionProps) {
  const copy = COPY[locale as keyof typeof COPY] ?? COPY.en;
  const sectionRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const parallaxY = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);

  const syncBounds = useCallback(() => {
    const rail = railRef.current;
    if (!rail || rail.scrollWidth === 0) return;

    setAtStart(rail.scrollLeft <= 8);
    setAtEnd(rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 8);
  }, []);

  useEffect(() => {
    syncBounds();
    window.addEventListener("resize", syncBounds);
    return () => window.removeEventListener("resize", syncBounds);
  }, [syncBounds]);

  const scrollByCard = (direction: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;

    const card = rail.querySelector<HTMLElement>("[data-news-card]");
    const step = card
      ? Math.max(card.offsetWidth + CARD_GAP_PX, rail.clientWidth * 0.8)
      : rail.clientWidth * FALLBACK_SCROLL_RATIO;

    rail.scrollBy({ left: direction * step });
  };


  if (!posts || posts.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      aria-label={copy.sectionLabel}
      className="relative flex min-h-[85vh] sm:min-h-[90vh] w-full flex-col justify-center overflow-hidden bg-primary py-24 sm:py-36 lg:py-44"
    >
      {/* Parallax Background Graphic & Ambient Lighting */}
      <div aria-hidden className="pointer-events-none absolute inset-0 select-none z-0 overflow-hidden">
        <motion.div
          style={{ y: parallaxY }}
          className="absolute -top-[25%] -bottom-[25%] inset-x-0 h-[150%]"
        >
          {/* Genuinely decorative: a parallax texture inside an aria-hidden
              wrapper. An alt here would inject noise into the section for
              screen-reader users and say nothing about the news content. */}
          <Image
            src="/images/new-bg.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-25"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-primary/60 via-primary/30 to-primary/80 z-10" />
        <div className="absolute -top-32 right-0 h-[520px] w-[520px] rounded-full bg-radial from-secondary-container/12 to-transparent blur-3xl z-10" />
        <div className="absolute -bottom-40 -left-24 h-[460px] w-[460px] rounded-full bg-radial from-primary-fixed-dim/10 to-transparent blur-3xl z-10" />
      </div>

      <div className="relative z-10 my-auto">
        {/* Header: heading left, standfirst right — clean editorial masthead */}
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-8 px-6 sm:px-10 lg:grid-cols-12 lg:items-start lg:gap-16 lg:px-16">
          <div className="lg:col-span-7 lg:pt-6">
            <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-secondary-fixed-dim">
              {copy.kicker}
            </span>

            <h2 className="mt-3 font-display text-[clamp(34px,5.5vw,60px)] uppercase leading-[1.2] tracking-[0.14em] !text-white">
              {copy.heading}
            </h2>

            <Link
              href={localizedPath(locale, "/blog")}
              className="group mt-6 inline-flex items-center gap-3 text-md font-bold uppercase tracking-[0.18em] text-secondary-fixed-dim transition-colors hover:text-white"
            >
              <span>{copy.viewAll}</span>
              <svg
                className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m0 0l-6-6m6 6l-6 6" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Card rail: inset to the container gutter on the left, bleeding past
            the right edge so the next card is always half-visible. */}
        <div className="relative mt-16 lg:mt-24">
          {/* Arrow controls centered vertically — hidden on mobile view, visible on desktop (lg:flex) */}
          <div className="pointer-events-none absolute inset-y-0 inset-x-0 mx-auto hidden max-w-[1280px] items-center justify-between px-4 sm:px-8 lg:px-12 z-30 lg:flex">
            {/* Prev Arrow */}
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              disabled={atStart}
              aria-label={copy.prev}
              className="group pointer-events-auto flex size-12 sm:size-14 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-white/20 text-white shadow-xl backdrop-blur-[14px] transition-all duration-300 hover:border-white hover:bg-white/35 hover:scale-110 active:scale-95 disabled:pointer-events-none disabled:opacity-0"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-5 sm:size-6 fill-current text-white transition-transform duration-200 group-hover:scale-110"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M 17.5 4.5 L 5.5 12 L 17.5 19.5 L 14.2 12 Z" />
              </svg>
            </button>

            {/* Next Arrow */}
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              disabled={atEnd}
              aria-label={copy.next}
              className="group pointer-events-auto flex size-12 sm:size-14 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-white/20 text-white shadow-xl backdrop-blur-[14px] transition-all duration-300 hover:border-white hover:bg-white/35 hover:scale-110 active:scale-95 disabled:pointer-events-none disabled:opacity-0"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-5 sm:size-6 fill-current text-white transition-transform duration-200 group-hover:scale-110"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M 6.5 4.5 L 18.5 12 L 6.5 19.5 L 9.8 12 Z" />
              </svg>
            </button>
          </div>

          <div
            ref={railRef}
            onScroll={syncBounds}
            role="region"
            aria-label={copy.railLabel}
            tabIndex={0}
            className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth scroll-pl-6 pr-6 pb-4 pl-6 [scrollbar-width:none] motion-reduce:scroll-auto sm:scroll-pl-10 sm:pl-10 lg:scroll-pl-[calc(max(0px,(100vw-1280px)/2)_+_4rem)] lg:pl-[calc(max(0px,(100vw-1280px)/2)_+_4rem)] [&::-webkit-scrollbar]:hidden"
          >
            {posts.map((post, index) => {
              return (
                <article
                  key={post.id}
                  data-news-card
                  className="w-[280px] shrink-0 snap-start sm:w-[340px] lg:w-[370px]"
                >
                  <Link
                    href={post.href}
                    className="group relative block aspect-[5/6] overflow-hidden rounded-2xl no-underline shadow-lg ring-1 ring-white/10 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:ring-white/25 focus-visible:-translate-y-1.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-secondary-fixed-dim"
                  >
                    <Image
                      src={post.imageSrc}
                      alt={
                        locale === "vi"
                          ? `Ảnh bìa bài viết: ${post.title}`
                          : `Cover image for: ${post.title}`
                      }
                      fill
                      sizes="(max-width: 640px) 264px, (max-width: 1024px) 300px, 324px"
                      loading={index < 2 ? "eager" : undefined}
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                    />

                    {/* Smooth bottom backdrop blur & gradient scrim */}
                    <div
                      aria-hidden
                      className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/85 via-black/45 to-transparent backdrop-blur-md [mask-image:linear-gradient(to_top,black_60%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_top,black_60%,transparent_100%)]"
                    />

                    {/* Clean, high-contrast caption area */}
                    <div className="absolute inset-x-0 bottom-0 flex flex-col items-start p-5 sm:p-6 w-full overflow-hidden">
                      <h3
                        title={post.title}
                        className={`${playfair.className} w-full truncate text-xl sm:text-2xl font-normal italic leading-snug !text-white drop-shadow-sm transition-transform duration-300 group-hover:translate-x-1`}
                      >
                        {post.title}
                      </h3>

                      {post.tag ? (
                        <span className="mt-2.5 inline-flex items-center rounded-full border border-white/20 bg-white/20 px-3.5 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-md transition-colors duration-300 group-hover:bg-white/30">
                          {post.tag}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>

          {/* Mobile swipe affordance — mirrors ProductShowcase's hint. */}
          <p className="mt-4 flex items-center justify-center gap-1.5 px-6 text-[11px] font-semibold uppercase tracking-wider text-white/50 lg:hidden">
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            {copy.swipeHint}
          </p>
        </div>
      </div>
    </section>
  );
}
