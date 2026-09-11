import { pickTranslation, toBookChapters } from "@/lib/utils/BrandStoryPresenter";
import type { IBrandStory, IBrandStoryChapter } from "@/models/BrandStory";

function chapter(overrides: Partial<IBrandStoryChapter> = {}): IBrandStoryChapter {
  return {
    images: ["brand-story/a.jpg", "brand-story/b.jpg"],
    translations: [{ locale: "vi", title: "Câu Chuyện" }],
    ...overrides,
  } as unknown as IBrandStoryChapter;
}

describe("pickTranslation", () => {
  it("returns the exact-locale translation when it exists", () => {
    const result = pickTranslation(
      chapter({
        translations: [
          { locale: "vi", title: "A" },
          { locale: "en", title: "B" },
        ],
      }),
      "en"
    );
    expect(result?.locale).toBe("en");
  });

  it("falls back to the default locale (vi) when the requested one is missing", () => {
    const result = pickTranslation(chapter(), "en");
    expect(result?.locale).toBe("vi");
  });

  it("returns null for a chapter with no translations", () => {
    const result = pickTranslation(chapter({ translations: [] }), "vi");
    expect(result).toBeNull();
  });
});

describe("toBookChapters", () => {
  it("returns an empty array when there is no saved brand story", () => {
    expect(toBookChapters(null, "vi")).toEqual([]);
  });

  it("maps chapters to the book shape, resolving titles and image URLs for the locale", () => {
    const result = toBookChapters(
      {
        chapters: [
          chapter({
            images: ["brand-story/a.jpg", "brand-story/b.jpg"],
            translations: [
              { locale: "vi", title: "Câu Chuyện" },
              { locale: "en", title: "Our Story" },
            ],
          }),
        ],
      } as Pick<IBrandStory, "chapters">,
      "en"
    );

    expect(result).toEqual([
      {
        title: "Our Story",
        images: ["/api/media/public/brand-story/a.jpg", "/api/media/public/brand-story/b.jpg"],
      },
    ]);
  });

  it("drops a chapter with no images", () => {
    const result = toBookChapters(
      { chapters: [chapter({ images: [] })] } as Pick<IBrandStory, "chapters">,
      "vi"
    );
    expect(result).toEqual([]);
  });

  it("drops a chapter with no usable translation", () => {
    const result = toBookChapters(
      { chapters: [chapter({ translations: [] })] } as Pick<IBrandStory, "chapters">,
      "vi"
    );
    expect(result).toEqual([]);
  });

  it("preserves chapter order", () => {
    const result = toBookChapters(
      {
        chapters: [
          chapter({ translations: [{ locale: "vi", title: "First" }] }),
          chapter({ translations: [{ locale: "vi", title: "Second" }] }),
        ],
      } as Pick<IBrandStory, "chapters">,
      "vi"
    );
    expect(result.map((c) => c.title)).toEqual(["First", "Second"]);
  });
});
