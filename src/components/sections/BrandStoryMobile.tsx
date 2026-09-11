"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { type BrandStoryChapter } from "@/config/brandStoryChapters";

interface BrandStoryMobileProps {
  locale: string;
  chapters: BrandStoryChapter[];
}

const COPY = {
  vi: {
    kicker: "CÂU CHUYỆN THƯƠNG HIỆU",
    headingLines: ["TỪ HẠT LÚA MẠCH", "ĐẾN LY BIA TRÒN VỊ"],
    subtitle: "Khám phá hành trình chế tác thủ công tạo nên hương vị nguyên bản của Otter Beer.",
    pageOf: (page: number, total: number) => `TRANG ${page} / ${total}`,
    swipeHint: "VUỐT ĐỂ CHUYỂN TRANG",
  },
  en: {
    kicker: "BRAND STORY",
    headingLines: ["FROM GRAIN TO", "GOLDEN GLASS"],
    subtitle: "Discover the authentic craft journey behind every drop of Otter Beer.",
    pageOf: (page: number, total: number) => `PAGE ${page} / ${total}`,
    swipeHint: "SWIPE TO TURN PAGE",
  },
} as const;


/* Alternating subtle rotation angles for editorial filmstrip effect */
const SLIDE_ROTATIONS = [
  "rotate-1",
  "-rotate-1",
  "rotate-2",
  "-rotate-2",
  "rotate-1",
  "-rotate-1",
  "rotate-2",
  "-rotate-1",
];

interface MobileSlide {
  src: string;
  chapterIndex: number;
  chapterTitle: string;
  imageIndexInChapter: number;
  totalInChapter: number;
  rotationClass: string;
}

export function BrandStoryMobile({ locale, chapters }: BrandStoryMobileProps) {
  const copy = COPY[locale as keyof typeof COPY] ?? COPY.en;
  const [currentIndex, setCurrentIndex] = useState(0);

  // Section intersection observer state for hiding bottom nav outside section
  const [isInView, setIsInView] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Touch gesture state
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  // IntersectionObserver configured so sticky bottom nav closes immediately when another section enters view
  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting && entry.intersectionRatio >= 0.6);
      },
      {
        rootMargin: "-15% 0px -15% 0px",
        threshold: [0, 0.2, 0.4, 0.6, 0.8, 1.0],
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Reduce to 4 chapters as requested
  const displayChapters = useMemo(() => chapters.slice(0, 4), [chapters]);

  // Flatten images into a unified slides array for the 4 chapters
  const { slides, chapterStartIndices } = useMemo(() => {
    const flatSlides: MobileSlide[] = [];
    const startIndices: number[] = [];
    let slideIdx = 0;

    displayChapters.forEach((chap, cIdx) => {
      startIndices.push(flatSlides.length);
      chap.images.forEach((img, iIdx) => {
        flatSlides.push({
          src: img,
          chapterIndex: cIdx,
          chapterTitle: chap.title,
          imageIndexInChapter: iIdx + 1,
          totalInChapter: chap.images.length,
          rotationClass: SLIDE_ROTATIONS[slideIdx % SLIDE_ROTATIONS.length],
        });
        slideIdx++;
      });
    });

    return { slides: flatSlides, chapterStartIndices: startIndices };
  }, [displayChapters]);

  const totalSlides = slides.length;

  // Defer preloading of brand story slide images until browser is idle to avoid network contention with hero section
  useEffect(() => {
    if (!slides || slides.length === 0) return;

    let cancelled = false;

    const startPreload = () => {
      if (cancelled) return;
      slides.forEach((slide) => {
        if (slide.src) {
          const img = new window.Image();
          if ("fetchPriority" in img) {
            (img as unknown as { fetchPriority: string }).fetchPriority = "low";
          }
          img.src = slide.src;
        }
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
      ).requestIdleCallback(startPreload, { timeout: 3500 });
      return () => {
        cancelled = true;
        if ("cancelIdleCallback" in window) {
          (
            window as unknown as { cancelIdleCallback: (id: number) => void }
          ).cancelIdleCallback(handle);
        }
      };
    } else {
      const timer = setTimeout(startPreload, 3500);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }
  }, [slides]);

  const activeSlide = slides[currentIndex] || slides[0];

  const [isImageLoading, setIsImageLoading] = useState(true);
  const [prevSlideSrc, setPrevSlideSrc] = useState(activeSlide?.src);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset loading state when active slide image changes (during render to avoid cascading renders)
  if (activeSlide?.src !== prevSlideSrc) {
    setPrevSlideSrc(activeSlide?.src);
    setIsImageLoading(true);
  }

  // Handle cached images or already complete images where onLoad might not fire
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setIsImageLoading(false);
    }
  }, [activeSlide?.src]);

  if (!chapters || chapters.length === 0 || totalSlides === 0) {
    return null;
  }

  // Active chapter determination
  const activeChapterIndex = activeSlide ? activeSlide.chapterIndex : 0;


  const handleNext = () => {
    if (currentIndex < totalSlides - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const jumpToChapter = (chapIdx: number) => {
    const targetIndex = chapterStartIndices[chapIdx];
    if (typeof targetIndex === "number" && targetIndex >= 0 && targetIndex < totalSlides) {
      setCurrentIndex(targetIndex);
    }
  };

  // Touch handlers for swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchEndXRef.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null || touchEndXRef.current === null) return;
    const diffX = touchStartXRef.current - touchEndXRef.current;
    const minSwipeDistance = 35;

    if (diffX > minSwipeDistance) {
      // Swiped left -> Next slide
      handleNext();
    } else if (diffX < -minSwipeDistance) {
      // Swiped right -> Prev slide
      handlePrev();
    }

    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  return (
    <div
      ref={sectionRef}
      className="relative w-full bg-[#00153e] text-[#fdf9f4] overflow-hidden min-h-[110dvh] flex flex-col justify-between pt-20 sm:pt-24 pb-24 select-none"
    >
      {/* Fixed Parallax Radial Background Stage */}
      <div
        className="absolute inset-0 pointer-events-none z-0 bg-fixed"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, rgba(0, 40, 103, 0.88) 0%, rgba(0, 21, 62, 1) 100%)",
          backgroundAttachment: "fixed",
        }}
      />

      {/* Fixed Parallax SVG Grid Texture */}
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-10 bg-fixed"
        style={{
          backgroundImage:
            "url('data:image/svg+xml;utf8,<svg width=\"60\" height=\"60\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M0 30 Q 30 60 60 30\" stroke=\"%23ffffff\" fill=\"none\" stroke-width=\"1.5\"/></svg>')",
          backgroundRepeat: "repeat",
          backgroundAttachment: "fixed",
        }}
      />

      {/* Header Section */}
      <div className="relative z-10 flex flex-col items-center w-full px-5 text-center mb-6">
        <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.24em] text-[#b1c5ff] uppercase mb-3">
          <span className="h-px w-5 bg-[#b1c5ff]/50" />
          {copy.kicker}
          <span className="h-px w-5 bg-[#b1c5ff]/50" />
        </div>

        {/* Headline with adequate leading for Vietnamese diacritics */}
        <h2 className="font-display text-[32px] sm:text-[36px] leading-[1.18] tracking-tight text-[#fdf9f4] uppercase space-y-1">
          {copy.headingLines.map((line, idx) => (
            <span key={idx} className="block text-[#fdf9f4]">
              {line}
            </span>
          ))}
        </h2>

        <p className="mt-4 text-[14px] text-[#e6e2dd] leading-[1.6] max-w-xs mx-auto">
          {copy.subtitle}
        </p>
      </div>

      {/* Main Slide Interactive Stage */}
      <div
        className="relative w-full max-w-sm mx-auto px-5 z-10 flex-1 flex flex-col justify-center items-center cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Brutalist Picture Frame Container */}
        <div
          className={`relative w-full max-w-[340px] bg-[#fdf9f4] text-[#1c1c19] border-2 border-[#3F2424] shadow-[6px_6px_0px_#3F2424] p-3.5 transition-transform duration-300 ease-out transform ${activeSlide.rotationClass}`}
        >

          {/* Top Chapter Tag */}
          <div className="absolute top-4 left-4 z-20 bg-[#fdf9f4]/95 text-[#00153e] px-2.5 py-1 text-[11px] font-bold uppercase border border-[#3F2424]">
            CH. {activeSlide.chapterIndex + 1}
          </div>

          {/* Main Image with Locked Height */}
          <div className="relative w-full h-[440px] sm:h-[480px] overflow-hidden border border-[#3F2424]/40 bg-[#ebe8e3]">
            {/* Loading Spinner Indicator */}
            {isImageLoading && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#ebe8e3]/80 backdrop-blur-sm pointer-events-none">
                <div className="flex items-center justify-center rounded-xl bg-[#fdf9f4] p-3 border border-[#3F2424] shadow-[3px_3px_0px_#3F2424]">
                  <svg
                    className="size-7 animate-spin text-[#002867]"
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
              </div>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              key={activeSlide?.src}
              src={activeSlide.src}
              alt={`${activeSlide.chapterTitle}`}
              className="w-full h-full object-cover transition-opacity duration-300"
              onLoad={() => setIsImageLoading(false)}
              onError={() => setIsImageLoading(false)}
            />

            {/* Inner Vignette / Grain */}
            <div className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-20 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.6)_100%)]" />
          </div>

          {/* Bottom Card Ledger Bar */}
          <div className="mt-3 flex justify-center items-center px-1 text-[13px] text-[#3F2424]">
            <span className="font-bold uppercase tracking-wider text-center truncate max-w-[280px]">
              {activeSlide.chapterTitle}
            </span>
          </div>
        </div>

        {/* Clean Page Counter & Swipe Hint */}
        <div className="mt-7 flex flex-col items-center gap-2">
          <span className="text-[13px] font-bold tracking-[0.2em] text-[#fdf9f4] uppercase bg-[#002867] px-4 py-2 border border-[#3F2424] shadow-[3px_3px_0px_#3F2424]">
            {copy.pageOf(currentIndex + 1, totalSlides)}
          </span>

          {/* Swipe Hint */}
          <span className="text-[11px] font-bold tracking-widest text-[#b1c5ff] uppercase mt-0.5">
            {copy.swipeHint}
          </span>
        </div>
      </div>

      {/* Sticky Bottom Chapter Navigation Bar (4-Column Layout for Maximum Legibility) */}
      <nav
        className={`fixed bottom-0 left-0 w-full grid grid-cols-4 items-center gap-1 px-2 py-2.5 bg-[#fdf9f4] text-[#1c1c19] border-t-2 border-[#3F2424] z-50 shadow-[0_-4px_16px_rgba(0,0,0,0.4)] transition-all duration-300 ease-in-out ${
          isInView
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "translate-y-full opacity-0 pointer-events-none"
        }`}
        aria-label="Brand Story Chapters"
      >
        {displayChapters.map((chap, chapIdx) => {
          const isActive = chapIdx === activeChapterIndex;
          return (
            <button
              key={chapIdx}
              onClick={() => jumpToChapter(chapIdx)}
              className={`flex items-center justify-center min-h-[46px] px-1 py-2 rounded-md transition-all duration-200 ${
                isActive
                  ? "bg-[#002867] text-[#ffffff] border-2 border-[#3F2424] shadow-[2px_2px_0px_#3F2424] font-bold"
                  : "text-[#1c1c19] font-bold hover:bg-[#ebe8e3]"
              }`}
            >
              <span className="text-[13px] sm:text-[14px] font-extrabold tracking-tight uppercase whitespace-nowrap text-center">
                {chap.title}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
