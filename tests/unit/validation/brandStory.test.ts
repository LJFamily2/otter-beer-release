import { BrandStoryChapterInputSchema, BrandStoryUpdateSchema } from "@/lib/validation/brandStory";

function viTranslation(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    locale: "vi",
    title: "Our Story",
    ...overrides,
  };
}

function baseChapter(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    images: ["brand-story/page-1.jpg"],
    translations: [viTranslation()],
    ...overrides,
  };
}

describe("BrandStoryChapterInputSchema", () => {
  it("accepts a valid chapter with only the required (vi) locale", () => {
    const result = BrandStoryChapterInputSchema.safeParse(baseChapter());
    expect(result.success).toBe(true);
  });

  it("accepts a chapter with multiple images", () => {
    const result = BrandStoryChapterInputSchema.safeParse(
      baseChapter({ images: ["a.jpg", "b.jpg", "c.jpg"] })
    );
    expect(result.success).toBe(true);
  });

  it("rejects a chapter missing the required vi locale", () => {
    const result = BrandStoryChapterInputSchema.safeParse(
      baseChapter({ translations: [viTranslation({ locale: "en" })] })
    );
    expect(result.success).toBe(false);
  });

  it("rejects duplicate locales on the same chapter", () => {
    const result = BrandStoryChapterInputSchema.safeParse(
      baseChapter({ translations: [viTranslation(), viTranslation()] })
    );
    expect(result.success).toBe(false);
  });

  it("rejects an unsupported locale code", () => {
    const result = BrandStoryChapterInputSchema.safeParse(
      baseChapter({ translations: [{ ...viTranslation(), locale: "fr" }] })
    );
    expect(result.success).toBe(false);
  });

  it("rejects a chapter with no images", () => {
    const result = BrandStoryChapterInputSchema.safeParse(baseChapter({ images: [] }));
    expect(result.success).toBe(false);
  });

  it("rejects more than 12 images", () => {
    const images = Array.from({ length: 13 }, (_, i) => `img-${i}.jpg`);
    const result = BrandStoryChapterInputSchema.safeParse(baseChapter({ images }));
    expect(result.success).toBe(false);
  });

  it("rejects an empty image entry", () => {
    const result = BrandStoryChapterInputSchema.safeParse(baseChapter({ images: [""] }));
    expect(result.success).toBe(false);
  });

  it("rejects a title over the max length", () => {
    const result = BrandStoryChapterInputSchema.safeParse(
      baseChapter({ translations: [viTranslation({ title: "a".repeat(81) })] })
    );
    expect(result.success).toBe(false);
  });
});

describe("BrandStoryUpdateSchema", () => {
  it("accepts an empty chapters array (flipbook with no chapters yet)", () => {
    const result = BrandStoryUpdateSchema.safeParse({ chapters: [] });
    expect(result.success).toBe(true);
  });

  it("accepts multiple valid chapters", () => {
    const result = BrandStoryUpdateSchema.safeParse({ chapters: [baseChapter(), baseChapter()] });
    expect(result.success).toBe(true);
  });

  it("rejects more than 10 chapters", () => {
    const chapters = Array.from({ length: 11 }, () => baseChapter());
    const result = BrandStoryUpdateSchema.safeParse({ chapters });
    expect(result.success).toBe(false);
  });

  it("rejects the whole payload when any single chapter is invalid", () => {
    const result = BrandStoryUpdateSchema.safeParse({
      chapters: [baseChapter(), baseChapter({ images: [] })],
    });
    expect(result.success).toBe(false);
  });

  it("requires a chapters field", () => {
    const result = BrandStoryUpdateSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
