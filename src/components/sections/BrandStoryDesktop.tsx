"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { playPageTurn } from "@/lib/utils/pageTurnSound";
import HTMLFlipBook from "react-pageflip";
import {
  buildBrandStoryBook,
  chapterIndexForSpread,
  type BrandStoryChapter,
} from "@/config/brandStoryChapters";

interface BrandStoryDesktopProps {
  locale: string;
  chapters: BrandStoryChapter[];
}

const COPY = {
  vi: {
    kicker: "CÂU CHUYỆN THƯƠNG HIỆU",
    /* Broken by hand rather than by word: Anton is condensed and Vietnamese
       diacritics need the extra leading, so balanced lines read better than
       one word per line. */
    headingLines: ["TỪ HẠT", "LÚA MẠCH", "ĐẾN LY BIA"],
    subtitle: "Lật mở từng trang sử thi về niềm đam mê ủ bia thủ công và hành trình kiến tạo hương vị độc bản.",
    prev: "Trang trước",
    next: "Trang sau",
    pageOf: (page: number, total: number) => `Trang ${page} / ${total}`,
    bookLabel: "Cuốn sách câu chuyện thương hiệu",
    goToChapter: (title: string) => `Mở chương ${title}`,
    chapterProgress: (spread: number, total: number, images: number) =>
      `Trang ${spread} / ${total} của chương, gồm ${images} ảnh`,
    turnHint: "KÉO HOẶC CLICK ĐỂ LẬT TRANG",
    chapterCount: (total: number) => `${String(total).padStart(2, "0")} CHƯƠNG`,
  },
  en: {
    kicker: "BRAND STORY",
    headingLines: ["FROM", "GRAIN TO", "GLASS"],
    subtitle: "Turn the pages of our brand story and explore the passion behind our authentic craft brewing.",
    prev: "Previous page",
    next: "Next page",
    pageOf: (page: number, total: number) => `Page ${page} of ${total}`,
    bookLabel: "Brand story book",
    goToChapter: (title: string) => `Open chapter ${title}`,
    chapterProgress: (spread: number, total: number, images: number) =>
      `Spread ${spread} of ${total} in this chapter, ${images} images`,
    turnHint: "DRAG OR CLICK TO TURN THE PAGE",
    chapterCount: (total: number) => `${String(total).padStart(2, "0")} CHAPTERS`,
  },
} as const;

const ACTIVE_TAB_WIDTH = 104;
const INACTIVE_TAB_WIDTH = 44;
const TAB_STEP_OFFSET = 36;

interface PageFlipInstance {
  pageFlip: () => {
    flipNext: () => void;
    flipPrev: () => void;
    turnToPage: (page: number) => void;
  };
}

interface PageFlipEvent {
  data: number;
}

const FlipBook = HTMLFlipBook as unknown as React.ComponentType<
  Partial<Omit<React.ComponentProps<typeof HTMLFlipBook>, "children">> & {
    children: React.ReactNode;
  }
>;

export function BrandStoryDesktop({ locale, chapters }: BrandStoryDesktopProps) {
  const copy = COPY[locale as keyof typeof COPY] ?? COPY.en;
  const [pageIndex, setPageIndex] = useState(0);
  const [titleMousePos, setTitleMousePos] = useState<{ x: number; y: number } | null>(null);
  const [isTitleHovered, setIsTitleHovered] = useState(false);
  const bookRef = useRef<PageFlipInstance | null>(null);

  const book = useMemo(() => buildBrandStoryBook(chapters ?? []), [chapters]);
  const { pages: PAGES, chapters: CHAPTERS, totalSpreads: TOTAL_SPREADS } = book;

  // Defer preloading of brand story book images until browser is idle to avoid network contention with hero section
  useEffect(() => {
    if (!PAGES || PAGES.length === 0) return;

    let cancelled = false;

    const startPreload = () => {
      if (cancelled) return;
      PAGES.forEach((page) => {
        if (page.src) {
          const img = new window.Image();
          if ("fetchPriority" in img) {
            (img as unknown as { fetchPriority: string }).fetchPriority = "low";
          }
          img.src = page.src;
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
  }, [PAGES]);

  if (!chapters || chapters.length === 0 || CHAPTERS.length === 0) {
    return null;
  }

  const LAST_PAGE_INDEX = TOTAL_SPREADS * 2 - 2;

  const currentSpreadIndex = Math.floor(pageIndex / 2);
  const isFirst = pageIndex === 0;
  const isLast = pageIndex >= LAST_PAGE_INDEX;

  /* A chapter owns a run of spreads, so advancing one spread usually stays
     inside the same chapter — the tab only changes over once its last spread
     has been turned. */
  const activeChapterIndex = chapterIndexForSpread(book, currentSpreadIndex);
  const activeChapter = CHAPTERS[activeChapterIndex];
  const spreadInChapter = currentSpreadIndex - activeChapter.startSpread;

  // Dynamic tab stack container width calculations
  const leftTabCount = activeChapterIndex;
  const leftTabContainerWidth =
    leftTabCount === 0 ? 0 : (leftTabCount - 1) * TAB_STEP_OFFSET + INACTIVE_TAB_WIDTH;

  const rightTabCount = CHAPTERS.length - activeChapterIndex;
  const rightTabContainerWidth =
    rightTabCount === 0 ? 0 : ACTIVE_TAB_WIDTH + (rightTabCount - 1) * TAB_STEP_OFFSET;

  const handleTitleMouseMove = (e: React.MouseEvent<HTMLDivElement | HTMLHeadingElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTitleMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsTitleHovered(true);
  };

  const handleTitleMouseLeave = () => {
    setIsTitleHovered(false);
  };

  function turn(direction: "next" | "prev") {
    const flipInstance = bookRef.current?.pageFlip();
    if (!flipInstance) return;

    try {
      if (direction === "next" && !isLast) {
        flipInstance.flipNext();
        playPageTurn();
        const nextIndex = Math.min(pageIndex + 2, LAST_PAGE_INDEX);
        setPageIndex(nextIndex);
      } else if (direction === "prev" && !isFirst) {
        flipInstance.flipPrev();
        playPageTurn();
        const prevIndex = Math.max(pageIndex - 2, 0);
        setPageIndex(prevIndex);
      }
    } catch (error) {
      console.warn("Page flip error:", error);
    }
  }

  function turnToChapter(chapterIndex: number) {
    const flipInstance = bookRef.current?.pageFlip();
    if (!flipInstance) return;

    try {
      const targetPage = CHAPTERS[chapterIndex].startSpread * 2;
      flipInstance.turnToPage(targetPage);
      playPageTurn();
      setPageIndex(targetPage);
    } catch (error) {
      console.warn("Turn to chapter error:", error);
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      turn("next");
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      turn("prev");
    }
  }

  const onPageFlip = (e: PageFlipEvent) => {
    setPageIndex(e.data);
  };

  return (
    <div className="relative mx-auto flex w-full max-w-[1850px] items-center gap-10 xl:gap-14">
      {/* Left Title Section */}
      <div className="flex w-[290px] shrink-0 flex-col justify-center xl:w-[320px]">
        <span className="group flex items-center gap-3 text-[10px] font-bold tracking-[0.26em] text-[#c5a059] uppercase transition-colors duration-300 hover:text-[#e9c349]">
          <span aria-hidden className="h-px w-8 bg-gradient-to-r from-[#c5a059] to-[#c5a059]/40 transition-all duration-300 group-hover:w-10 group-hover:from-[#e9c349]" />
          {copy.kicker}
        </span>

        {/*
          Interactive Title Heading:
          Base warm ivory text + superimposed golden text-clip spotlight clipped strictly inside glyph shapes.
        */}
        <div className="relative mt-7 cursor-default select-none">
          {/* Base Warm Ivory Text Layer */}
          <h2
            onMouseMove={handleTitleMouseMove}
            onMouseLeave={handleTitleMouseLeave}
            className="font-display text-[60px] leading-[1.32] tracking-[-0.01em] uppercase text-[#f7f4ef] xl:text-[68px]"
          >
            {copy.headingLines.map((line) => (
              <span key={line} className="block text-[#f7f4ef]">
                {line}
              </span>
            ))}
          </h2>

          {/* Golden Spotlight Overlay Layer - Clipped Strictly to Text Glyphs with Smooth 500ms Fade */}
          <h2
            aria-hidden
            className={`pointer-events-none absolute inset-0 font-display text-[60px] leading-[1.32] tracking-[-0.01em] uppercase transition-opacity duration-500 ease-out xl:text-[68px] ${isTitleHovered ? "opacity-100" : "opacity-0"
              }`}
            style={{
              backgroundImage: titleMousePos
                ? `radial-gradient(circle 140px at ${titleMousePos.x}px ${titleMousePos.y}px, #e9c349 0%, #c5a059 50%, transparent 85%)`
                : "none",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {copy.headingLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h2>
        </div>

        <span aria-hidden className="mt-8 h-px w-14 bg-gradient-to-r from-[#c5a059]/40 to-transparent" />
      </div>

      {/* Right Book Section */}
      <div
        className="perspective-[1600px] relative min-w-0 flex-1 focus-visible:ring-2 focus-visible:ring-[#f5f1ea]/40 focus-visible:outline-none"
        role="group"
        aria-label={copy.bookLabel}
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        {/* Deep ambient ground shadow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-20 -bottom-10 h-20 rounded-[50%] bg-black/75 blur-3xl"
        />

        {/* Outer Backlight Ambient Glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-12 top-4 bottom-4 rounded-[24px] bg-[#e9c349]/10 blur-3xl"
        />

        {/* Outer Dark Hardcover Container — FIXED COVER THAT NEVER SHIFTS */}
        <div className="relative mx-auto w-full max-w-[1450px] rounded-[12px] border border-[#180609] bg-[#25080e] p-[8px] shadow-[0_35px_70px_-15px_rgba(0,0,0,0.88),inset_0_1px_1px_rgba(255,255,255,0.12)]">
          {/* Inner paper block underlay */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-[8px] rounded-[4px] bg-[#efeade] shadow-[inset_0_0_12px_rgba(0,0,0,0.15)]"
          />

          {/* Book Content Container with Left Tabs + Center Spread + Right Tabs */}
          <div className="relative flex w-full items-stretch justify-center min-h-[500px] lg:min-h-[620px] xl:min-h-[720px]">
            {/* LEFT SIDE STAGGERED TABS (Past/Read Chapters) */}
            <div
              className="relative z-10 flex shrink-0 items-stretch transition-[width] duration-500 ease-out"
              style={{ width: `${leftTabContainerWidth}px` }}
            >
              {CHAPTERS.map((chapter, index) => {
                if (index >= activeChapterIndex) return null;
                const reverseIndex = activeChapterIndex - 1 - index;
                return (
                  <button
                    key={chapter.title}
                    type="button"
                    onClick={() => turnToChapter(index)}
                    aria-label={copy.goToChapter(chapter.title)}
                    className="group absolute top-0 bottom-0 flex flex-col items-center border-r border-[#cfc7b4] bg-[#eae4d5] pt-6 transition-all duration-500 ease-out hover:brightness-105"
                    style={{
                      left: `${reverseIndex * TAB_STEP_OFFSET}px`,
                      width: `${INACTIVE_TAB_WIDTH}px`,
                      zIndex: index,
                      borderRadius: "6px 0 0 6px",
                      boxShadow:
                        "-6px 4px 14px rgba(0,0,0,0.18), inset 1px 1px 0 rgba(255,255,255,0.6)",
                    }}
                  >
                    <span className="text-[9px] font-bold tracking-[0.1em] text-[#2a0b12]/60">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span aria-hidden className="mt-2 h-3 w-px bg-[#2a0b12]/20" />
                    <span
                      className="mt-3 text-[9px] font-bold tracking-[0.18em] whitespace-nowrap text-[#2a0b12]/60 uppercase transition-colors group-hover:text-[#2a0b12]"
                      style={{ writingMode: "vertical-rl" }}
                    >
                      {chapter.title}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* CENTER BOOK SPREAD (2-Page FlipBook) */}
            <div className="relative min-w-0 flex-1 self-stretch aspect-[1126/761] min-h-[480px] lg:min-h-[600px] xl:min-h-[700px]">
              <div className="relative z-10 h-full w-full">
                <FlipBook
                  width={563}
                  height={761}
                  size="stretch"
                  minWidth={300}
                  maxWidth={1200}
                  minHeight={405}
                  maxHeight={1600}
                  maxShadowOpacity={0.4}
                  showCover={false}
                  usePortrait={false}
                  mobileScrollSupport={false}
                  useMouseEvents={false}
                  clickEventForward={false}
                  showPageCorners={false}
                  flippingTime={800}
                  onFlip={onPageFlip}
                  className="mx-auto h-full w-full"
                  ref={bookRef}
                >
                  {PAGES.map((page, index) => {
                    const side = index % 2 === 0 ? "left" : "right";
                    return (
                      <PageFace
                        key={`${page.chapterTitle}-${index}`}
                        src={page.src}
                        title={side === "left" ? page.chapterTitle : undefined}
                        side={side}
                        aria-hidden={Math.floor(index / 2) !== currentSpreadIndex}
                      />
                    );
                  })}
                </FlipBook>
              </div>
            </div>

            {/* RIGHT SIDE STAGGERED TABS (Current & Upcoming Chapters) */}
            <div
              className="relative z-10 flex shrink-0 items-stretch transition-[width] duration-500 ease-out"
              style={{ width: `${rightTabContainerWidth}px` }}
            >
              {CHAPTERS.map((chapter, index) => {
                if (index < activeChapterIndex) return null;

                const isCurrent = index === activeChapterIndex;
                const offsetIndex = index - activeChapterIndex;

                return (
                  <button
                    key={chapter.title}
                    type="button"
                    onClick={() => turnToChapter(index)}
                    aria-current={isCurrent ? "true" : undefined}
                    aria-label={copy.goToChapter(chapter.title)}
                    className={`group absolute top-0 bottom-0 flex flex-col items-center border-l border-[#cfc7b4] pt-6 transition-all duration-500 ease-out hover:brightness-105 ${isCurrent
                        ? "z-30 bg-[#f8f5ed]"
                        : "bg-[#eae4d5] hover:bg-[#f4efe2]"
                      }`}
                    style={{
                      left: `${isCurrent ? 0 : ACTIVE_TAB_WIDTH + (offsetIndex - 1) * TAB_STEP_OFFSET}px`,
                      width: `${isCurrent ? ACTIVE_TAB_WIDTH : INACTIVE_TAB_WIDTH}px`,
                      borderRadius: "0 6px 6px 0",
                      boxShadow: isCurrent
                        ? "8px 6px 20px rgba(0,0,0,0.22), inset -1px 1px 0 rgba(255,255,255,0.8)"
                        : "6px 4px 14px rgba(0,0,0,0.16), inset -1px 1px 0 rgba(255,255,255,0.5)",
                      zIndex: 30 - offsetIndex,
                    }}
                  >
                    {isCurrent ? (
                      <span className="flex w-full flex-col items-center px-3">
                        <span className="text-[10px] font-extrabold tracking-[0.14em] text-[#2a0b12]/50">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span aria-hidden className="mt-2 h-px w-6 bg-[#2a0b12]/30" />
                        <span className="mt-3 text-center text-[10px] leading-[1.45] font-bold tracking-[0.16em] text-[#2a0b12]/85 uppercase">
                          {chapter.title}
                        </span>

                        {chapter.spreadCount > 1 && (
                          <span aria-hidden className="mt-4 flex items-center gap-[4px]">
                            {Array.from({ length: chapter.spreadCount }).map((_, dot) => (
                              <span
                                key={dot}
                                className={`h-[4px] w-[4px] rounded-full transition-colors duration-300 ${dot === spreadInChapter
                                    ? "bg-[#2a0b12]/80"
                                    : "bg-[#2a0b12]/25"
                                  }`}
                              />
                            ))}
                          </span>
                        )}
                        <span className="sr-only">
                          {copy.chapterProgress(
                            spreadInChapter + 1,
                            chapter.spreadCount,
                            chapter.images.length
                          )}
                        </span>
                      </span>
                    ) : (
                      <>
                        <span className="text-[9px] font-bold tracking-[0.1em] text-[#2a0b12]/60">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span aria-hidden className="mt-2 h-3 w-px bg-[#2a0b12]/20" />
                        <span
                          className="mt-3 text-[9px] font-bold tracking-[0.18em] whitespace-nowrap text-[#2a0b12]/60 uppercase transition-colors group-hover:text-[#2a0b12]"
                          style={{ writingMode: "vertical-rl" }}
                        >
                          {chapter.title}
                        </span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Floating Navigation Arrow - Left */}
          <button
            type="button"
            onClick={() => turn("prev")}
            disabled={isFirst}
            aria-label={copy.prev}
            className="group absolute -left-5 top-1/2 z-50 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[#e9c349]/50 bg-[#25080e]/95 text-[#e9c349] shadow-[0_10px_25px_rgba(0,0,0,0.6)] backdrop-blur-md transition-all duration-300 hover:scale-110 hover:border-[#e9c349] hover:bg-[#25080e] disabled:pointer-events-none disabled:opacity-0"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="transition-transform group-hover:-translate-x-0.5"
            >
              <path d="M15.5 5v14l-10-7z" />
            </svg>
          </button>

          {/* Floating Navigation Arrow - Right */}
          <button
            type="button"
            onClick={() => turn("next")}
            disabled={isLast}
            aria-label={copy.next}
            className="group absolute -right-5 top-1/2 z-50 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[#e9c349]/50 bg-[#25080e]/95 text-[#e9c349] shadow-[0_10px_25px_rgba(0,0,0,0.6)] backdrop-blur-md transition-all duration-300 hover:scale-110 hover:border-[#e9c349] hover:bg-[#25080e] disabled:pointer-events-none disabled:opacity-0"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="transition-transform group-hover:translate-x-0.5"
            >
              <path d="M8.5 5v14l10-7z" />
            </svg>
          </button>
        </div>

        {/* Clean Chapter Dots Indicator */}
        <div className="mt-10 flex items-center justify-center">
          <div
            aria-hidden
            className="flex items-center gap-5 rounded-full border border-[#e9c349]/20 bg-[#25080e]/60 px-6 py-2.5 shadow-sm backdrop-blur-md"
          >
            {CHAPTERS.map((chapter) => (
              <div key={chapter.title} className="flex items-center gap-2">
                {Array.from({ length: chapter.spreadCount }).map((_, offset) => {
                  const spread = chapter.startSpread + offset;
                  return (
                    <span
                      key={spread}
                      className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${spread === currentSpreadIndex
                          ? "scale-125 bg-[#e9c349] shadow-[0_0_8px_rgba(233,195,73,0.8)]"
                          : "bg-[#f5f1ea]/30"
                        }`}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          <p aria-live="polite" className="sr-only">
            {copy.pageOf(currentSpreadIndex + 1, TOTAL_SPREADS)}
          </p>
        </div>
      </div>
    </div>
  );
}

const PageFace = React.forwardRef<
  HTMLDivElement,
  {
    side: "left" | "right";
    /** `null` renders a blank leaf — the padding page of an odd-length chapter. */
    src: string | null;
    title?: string;
    "aria-hidden"?: boolean;
  }
>(({ side, src, title, "aria-hidden": ariaHidden }, ref) => {
  const isPng = src?.toLowerCase().endsWith(".png");
  const [isLoaded, setIsLoaded] = useState(false);
  const [prevSrc, setPrevSrc] = useState(src);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset loaded state when page image src changes (during render to avoid cascading renders)
  if (src !== prevSrc) {
    setPrevSrc(src);
    setIsLoaded(false);
  }

  // Handle cached images or already complete images where onLoad might not fire
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setIsLoaded(true);
    }
  }, [src]);

  return (
    <div
      ref={ref}
      aria-hidden={ariaHidden}
      className={`relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-[#f6f4ee] ${side === "left" ? "rounded-l-[4px]" : "rounded-r-[4px]"
        }`}
    >
      {title && <h3 className="sr-only">{title}</h3>}
      {src !== null && (
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
          {!isLoaded && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#f6f4ee]/80 pointer-events-none">
              <svg
                className="size-6 animate-spin text-[#2a0b12]/40"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          )}
          {isPng ? (
            <div className="relative flex h-full w-full items-center justify-center p-6 xl:p-8">
              {/* Studio soft drop shadow for product PNGs */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-10 bottom-6 h-8 rounded-[50%] bg-black/20 blur-md"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                key={src}
                src={src}
                alt={title ?? ""}
                className="relative z-10 max-h-[92%] max-w-[92%] object-contain drop-shadow-[0_14px_22px_rgba(0,0,0,0.25)]"
                onLoad={() => setIsLoaded(true)}
                onError={() => setIsLoaded(true)}
              />
            </div>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              ref={imgRef}
              key={src}
              src={src}
              alt={title ?? ""}
              className="h-full w-full object-cover"
              onLoad={() => setIsLoaded(true)}
              onError={() => setIsLoaded(true)}
            />
          )}
        </div>
      )}

      <PaperGrain />

      {/* Page edge detail line */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-1 z-10 w-[8px] opacity-25 bg-[repeating-linear-gradient(to_right,rgba(42,11,18,0.2)_0px,rgba(42,11,18,0.2)_1px,transparent_1px,transparent_3px)] ${side === "left" ? "left-0 rounded-l-[3px]" : "right-0 rounded-r-[3px]"
          }`}
      />

      {/* Book spine gutter shadow - anchored precisely to the spine edge of each leaf */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20 mix-blend-multiply"
        style={{
          background:
            side === "left"
              ? "linear-gradient(to right, transparent 65%, rgba(42,11,18,0.08) 85%, rgba(42,11,18,0.35) 96%, rgba(42,11,18,0.75) 100%)"
              : "linear-gradient(to left, transparent 65%, rgba(42,11,18,0.08) 85%, rgba(42,11,18,0.35) 96%, rgba(42,11,18,0.75) 100%)",
        }}
      />

      {/* Bent page lighting highlight */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20 opacity-40 mix-blend-overlay"
        style={{
          background:
            side === "left"
              ? "linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.35) 15%, rgba(255,255,255,0) 40%)"
              : "linear-gradient(to left, rgba(255,255,255,0) 0%, rgba(255,255,255,0.35) 15%, rgba(255,255,255,0) 40%)",
        }}
      />
    </div>
  );
});
PageFace.displayName = "PageFace";

function PaperGrain() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.045] mix-blend-multiply"
    >
      <filter id="brand-story-grain-desktop">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#brand-story-grain-desktop)" />
    </svg>
  );
}
