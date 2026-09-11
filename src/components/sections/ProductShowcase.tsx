"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { buttonVariants } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import type { BeerShowcaseItem } from "@/lib/utils/BeerPresenter";

interface ProductShowcaseProps {
  locale: string;
  beers: BeerShowcaseItem[];
}

const COPY = {
  vi: {
    shop: "MUA NGAY",
    find: "TÌM CỬA HÀNG",
    style: "DÒNG BIA",
    abv: "NỒNG ĐỘ (ABV)",
    ibu: "ĐỘ ĐẮNG (IBU)",
    swipeHint: "Vuốt để xem các dòng bia khác",
    sectionLabel: "Các dòng bia thủ công Otter Beer",
    prevProduct: "Sản phẩm trước",
    nextProduct: "Sản phẩm tiếp theo",
    variantLabel: "Chọn phiên bản",
  },
  en: {
    shop: "SHOP NOW",
    find: "FIND LOCALLY",
    style: "STYLE",
    abv: "ALCOHOL (ABV)",
    ibu: "BITTERNESS (IBU)",
    swipeHint: "Swipe to explore products",
    sectionLabel: "Otter Beer craft beer range",
    prevProduct: "Previous Product",
    nextProduct: "Next Product",
    variantLabel: "Choose variant",
  },
} as const;

export function ProductShowcase({ locale, beers }: ProductShowcaseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [variantIndex, setVariantIndex] = useState(0);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const copy = COPY[locale as keyof typeof COPY] ?? COPY.en;
  const currentBeer = beers[currentIndex];
  const hasMultiple = beers.length > 1;

  const variants = currentBeer?.variants ?? [];
  // Guards the frame between a beer switch and the variant reset below, when
  // a stale index could still point past the new beer's shorter list.
  const activeVariantIndex = variantIndex < variants.length ? variantIndex : 0;
  const activeVariant = variants[activeVariantIndex] ?? null;
  // Beers with no packaging variants keep rendering exactly as before: the
  // main image, and no picker.
  const heroImageSrc = activeVariant?.imageSrc ?? currentBeer?.imageSrc;

  // Defer preloading of beer and variant images until browser is idle to avoid network contention with hero section
  useEffect(() => {
    if (!beers || beers.length === 0) return;

    let cancelled = false;

    const startPreload = () => {
      if (cancelled) return;
      const urls = new Set<string>();
      beers.forEach((beer) => {
        if (beer.imageSrc) urls.add(beer.imageSrc);
        if (beer.variants) {
          beer.variants.forEach((v) => {
            if (v.imageSrc) urls.add(v.imageSrc);
          });
        }
      });

      urls.forEach((src) => {
        const img = new window.Image();
        if ("fetchPriority" in img) {
          (img as unknown as { fetchPriority: string }).fetchPriority = "low";
        }
        img.src = src;
      });
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const handle = (
        window as unknown as {
          requestIdleCallback: (
            cb: () => void,
            opts?: { timeout: number }
          ) => number;
        }
      ).requestIdleCallback(startPreload, { timeout: 4000 });
      return () => {
        cancelled = true;
        if ("cancelIdleCallback" in window) {
          (
            window as unknown as { cancelIdleCallback: (id: number) => void }
          ).cancelIdleCallback(handle);
        }
      };
    } else {
      const timer = setTimeout(startPreload, 4000);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }
  }, [beers]);

  const [prevHeroImageSrc, setPrevHeroImageSrc] = useState(heroImageSrc);

  // Reset loading spinner whenever hero image source changes (during render to avoid cascading renders)
  if (heroImageSrc !== prevHeroImageSrc) {
    setPrevHeroImageSrc(heroImageSrc);
    setIsImageLoading(true);
  }

  if (!currentBeer) return null;

  const handlePrev = () => {
    setVariantIndex(0);
    setCurrentIndex((prev) => (prev === 0 ? beers.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setVariantIndex(0);
    setCurrentIndex((prev) => (prev === beers.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchStartX.current - touchEndX;
    const deltaY = touchStartY.current - touchEndY;

    // Minimum swipe threshold: 40px, ensuring horizontal movement dominates vertical scroll
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
      if (deltaX > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <section
      id="products"
      aria-label={copy.sectionLabel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative flex min-h-[100vh] flex-col items-center justify-center overflow-hidden bg-background px-5 pt-32 sm:pt-36 lg:pt-40 pb-16 sm:pb-20 lg:pb-24 transition-colors duration-700 select-none touch-pan-y"
      style={{
        "--color-primary": currentBeer.themeColor,
        "--color-primary-container": currentBeer.themeColorContainer
      } as React.CSSProperties}
    >
      {/* Dynamic Ambient Glow Background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 select-none overflow-hidden">
        {/* Soft Gold Radial Glow Center */}
        <div className="absolute top-1/2 left-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-radial from-secondary-container/30 via-secondary-container/5 to-transparent blur-3xl" />

        {/* Subtle Coastal Blue Vignette Accent */}
        <div className="absolute top-0 right-0 h-[400px] w-[400px] rounded-full bg-radial from-primary/5 to-transparent blur-2xl" />

        {/* Top-Shifted Editorial Background Watermark */}
        <div className="absolute top-28 sm:top-32 lg:top-36 inset-x-0 flex items-start justify-center pointer-events-none select-none">
          <span className="font-display text-[20vw] sm:text-[12vw] leading-normal whitespace-nowrap text-transparent [-webkit-text-stroke:2px_rgba(0,40,103,0.08)] tracking-wider uppercase transition-all duration-500 py-2">
            {currentBeer.style}
          </span>
        </div>
      </div>

      <div className="relative z-10 grid w-full max-w-[1280px] grid-cols-1 items-center gap-8 lg:grid-cols-3">

        {/* Left Column: Glassmorphic Spec Cards (Luxury Glass & Dials) */}
        <div className="hidden flex-col gap-6 lg:flex">
          {/* Card 1: Beer Style (Glassmorphism) */}
          <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/40 p-6 shadow-sm backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <p className="text-xs font-bold tracking-[0.15em] text-secondary uppercase">
                {copy.style}
              </p>
            </div>
            <p className="mt-3 font-display text-2xl tracking-wide text-primary">
              {currentBeer.style}
            </p>
          </div>

          {/* Card 2: ABV & IBU Specs (Dials) */}
          <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/40 p-6 shadow-sm backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">

              {/* ABV Drop Icon & Stat */}
              <div className="flex flex-1 flex-col justify-center gap-2">
                <div className="flex items-center gap-2.5">
                  <p className="text-[11px] font-bold tracking-[0.12em] text-primary/70 uppercase">
                    {copy.abv}
                  </p>
                </div>
                <p className="font-display text-3xl font-semibold text-primary">
                  {currentBeer.abv}
                </p>
              </div>

              {/* Vertical Divider */}
              <div className="h-16 w-px bg-primary/10" />

              {/* IBU Stat */}
              <div className="flex flex-1 flex-col items-end justify-center gap-2">
                <div className="flex items-center gap-2.5">
                  <p className="text-[11px] font-bold tracking-[0.12em] text-primary/70 uppercase">
                    {copy.ibu}
                  </p>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <p className="font-display text-3xl font-semibold text-primary">
                    {currentBeer.ibu}
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Center Column: Perfectly Sized Hero Product Display */}
        <div className="order-first flex flex-col items-center justify-center lg:order-none">
          <div className="group relative flex aspect-[4/5] w-full max-w-[320px] items-center justify-center lg:max-w-[340px]">
            {/* Soft Ambient Light Halo */}
            <div className="absolute size-[85%] rounded-full bg-radial from-secondary-container/50 via-primary-container/20 to-transparent blur-3xl transition-transform duration-700 group-hover:scale-110" />

            {/* Loading Spinner Indicator */}
            <AnimatePresence>
              {isImageLoading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
                >
                  <div className="flex items-center justify-center rounded-2xl bg-white/40 p-4 shadow-sm backdrop-blur-md border border-white/50">
                    <svg
                      className="size-8 animate-spin text-primary"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-label="Loading image"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3.5"
                      />
                      <path
                        className="opacity-80"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {/* Animated Can Image Container */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${currentBeer.id}-${activeVariantIndex}`}
                initial={{ opacity: 0, scale: 0.92, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: -15 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="relative h-full w-full transform-gpu transition-all duration-500 ease-out group-hover:-translate-y-2 group-hover:scale-105"
              >
                <Image
                  src={heroImageSrc}
                  alt={`${currentBeer.headline.replace(/\s+/g, " ").trim()}${activeVariant ? ` — ${activeVariant.shortName}` : ""} — ${currentBeer.style} Otter Beer, ${currentBeer.abv} ABV`}
                  fill
                  className="object-contain drop-shadow-[0_25px_30px_rgba(0,40,103,0.3)]"
                  sizes="(max-width: 1024px) 80vw, 360px"
                  priority
                  onLoad={() => setIsImageLoading(false)}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Realistic 3D Ground Reflection Shadow */}
          <div className="h-4 w-48 rounded-full bg-gradient-to-r from-transparent via-primary/30 to-transparent blur-md transition-all duration-500 group-hover:w-56 group-hover:opacity-80" />

          {/* Product Variant Picker — main image first, then each variant.
              The shared segmented Tabs fills the SELECTED tab with the beer's
              --color-primary and leaves the track neutral, and glides that
              fill between tabs. LayoutGroup scopes the glide to this beer:
              without it the fill would fly across from the previous product's
              control when the carousel advances. */}
          {variants.length > 0 ? (
            <div role="group" aria-label={copy.variantLabel} className="mt-6 max-w-full">
              <LayoutGroup id={`variant-picker-${currentBeer.id}`}>
                <Tabs
                  variant="segmented"
                  value={String(activeVariantIndex)}
                  onChange={(next) => setVariantIndex(Number(next))}
                  // Index as the value: two packs may legitimately share a
                  // label, and position is what actually identifies a tab.
                  // Tailwind preflight sets `text-transform: none` on
                  // <button>, so uppercase has to ride on the label itself
                  // rather than the container — and keeping it here leaves
                  // Tabs case-neutral for the admin, where locale names like
                  // "Tiếng Việt" must stay as written.
                  items={variants.map((variant, index) => ({
                    value: String(index),
                    label: (
                      <span className="uppercase tracking-wide">{variant.shortName}</span>
                    ),
                  }))}
                  className="max-w-full flex-wrap justify-center"
                />
              </LayoutGroup>
            </div>
          ) : null}

          {/* Mobile Spec Pill */}
          <div className="mt-6 flex items-center justify-center gap-4 border border-primary/20 bg-white/90 px-6 py-2.5 shadow-sm backdrop-blur-md lg:hidden">
            <span className="text-xs font-bold tracking-wide text-primary">
              {currentBeer.style}
            </span>
            <span className="h-3 w-px bg-outline-variant/40" />
            <span className="text-xs font-semibold text-on-surface-variant">
              ABV {currentBeer.abv}
            </span>
            <span className="h-3 w-px bg-outline-variant/40" />
            <span className="text-xs font-semibold text-on-surface-variant">
              IBU {currentBeer.ibu}
            </span>
          </div>

          {/* Mobile Swipe Hint */}
          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-primary/60 font-medium lg:hidden select-none">
            <svg className="size-3.5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            <span className="text-[11px] tracking-wider uppercase font-semibold text-primary/70">{copy.swipeHint}</span>
            <svg className="size-3.5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>

        {/* Right Column: Copy & Sharp Action Buttons */}
        <div className="flex flex-col items-center text-center lg:items-end lg:text-right">
          {/* Main Headline */}
          {/* h2, not h1: the page's h1 is the brand heading in HeroSection, and
              this heading swaps out every time the carousel advances — an h1
              that changes on click is a moving target for both a screen reader
              and a crawler's outline of the page. */}
          <motion.h2
            key={`headline-${currentBeer.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="font-display text-[clamp(34px,5vw,52px)] leading-[1.25] tracking-[0.12em] whitespace-pre-line text-primary uppercase"
          >
            {currentBeer.headline}
          </motion.h2>

          {/* Description */}
          <motion.p
            key={`desc-${currentBeer.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="mt-4 max-w-[340px] whitespace-pre-line text-base leading-relaxed text-on-surface-variant"
          >
            {currentBeer.description}
          </motion.p>

          {/* Sharp Architectural Buttons */}
          <div className="mt-7 flex flex-col gap-4 sm:flex-row">
            {/* Primary CTA */}
            <a
              href="#contact"
              className={buttonVariants("primary", "md")}
            >
              <span>{copy.shop}</span>
              <svg className="size-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Product Carousel Navigation: Spread to Outer Left & Right Ends */}
      {hasMultiple ? (
        <div className="relative z-20 mt-10 flex w-full max-w-[1380px] items-center justify-between px-4 sm:px-8 lg:px-12">
          {/* Left Ultra-Thin Long Arrow Button */}
          <button
            type="button"
            onClick={handlePrev}
            aria-label={copy.prevProduct}
            className="group flex cursor-pointer items-center p-2 text-primary transition-all duration-200 hover:opacity-100 active:scale-95"
          >
            <svg
              width="80"
              height="18"
              viewBox="0 0 80 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-primary stroke-[1] transition-all duration-300 group-hover:stroke-secondary group-hover:-translate-x-2"
            >
              <path d="M80 9H2M2 9L11 1M2 9L11 17" strokeLinecap="square" strokeLinejoin="miter" />
            </svg>
          </button>

          {/* Slide Counter Indicator */}
          <div className="font-display text-xs tracking-widest text-primary/70">
            <span>0{currentIndex + 1}</span>
            <span className="mx-1 text-primary/30">/</span>
            <span className="text-primary/40">0{beers.length}</span>
          </div>

          {/* Right Ultra-Thin Long Arrow Button */}
          <button
            type="button"
            onClick={handleNext}
            aria-label={copy.nextProduct}
            className="group flex cursor-pointer items-center p-2 text-primary transition-all duration-200 hover:opacity-100 active:scale-95"
          >
            <svg
              width="80"
              height="18"
              viewBox="0 0 80 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-primary stroke-[1] transition-all duration-300 group-hover:stroke-secondary group-hover:translate-x-2"
            >
              <path d="M0 9H78M78 9L69 1M78 9L69 17" strokeLinecap="square" strokeLinejoin="miter" />
            </svg>
          </button>
        </div>
      ) : null}
    </section>
  );
}





