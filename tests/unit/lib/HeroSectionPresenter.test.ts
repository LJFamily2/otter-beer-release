import { pickTranslation, toSlideItem } from "@/lib/utils/HeroSectionPresenter";
import type { IHeroSlide } from "@/models/HeroSection";

function slide(overrides: Partial<IHeroSlide> = {}): IHeroSlide {
  return {
    mediaKey: "hero/2026-08-27/uuid.jpg",
    mediaType: "image",
    status: "published",
    translations: [{ locale: "vi", alt: "Mô tả" }],
    ...overrides,
  } as unknown as IHeroSlide;
}

describe("pickTranslation", () => {
  it("returns the exact-locale translation when it exists", () => {
    const result = pickTranslation(
      slide({
        translations: [
          { locale: "vi", alt: "A" },
          { locale: "en", alt: "B" },
        ],
      }),
      "en"
    );
    expect(result?.locale).toBe("en");
  });

  it("falls back to the default locale (vi) when the requested one is missing", () => {
    const result = pickTranslation(slide(), "en");
    expect(result?.locale).toBe("vi");
  });

  it("returns null for a slide with no translations", () => {
    const result = pickTranslation(slide({ translations: [] }), "vi");
    expect(result).toBeNull();
  });
});

describe("toSlideItem", () => {
  it("maps a slide's fields to the hero shape for the requested locale including mobileSrc", () => {
    const item = toSlideItem(slide({ mediaKey: "hero/lager.jpg", mobileMediaKey: "hero/lager-mobile.jpg" }), "vi");

    expect(item).toEqual({
      src: "/api/media/public/hero/lager.jpg",
      mobileSrc: "/api/media/public/hero/lager-mobile.jpg",
      alt: "Mô tả",
      mediaType: "image",
    });
  });

  it("carries the video media type through", () => {
    const item = toSlideItem(slide({ mediaKey: "hero/clip.mp4", mediaType: "video" }), "vi");
    expect(item?.mediaType).toBe("video");
  });

  it("returns null when the slide has no translation at all", () => {
    const item = toSlideItem(slide({ translations: [] }), "vi");
    expect(item).toBeNull();
  });
});
