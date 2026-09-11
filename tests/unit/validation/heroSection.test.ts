import {
  HeroSlideInputSchema,
  HeroSectionUpdateSchema,
} from "@/lib/validation/heroSection";
import { MAX_HERO_SLIDES } from "@/config/heroSlide";

function viTranslation(overrides: Record<string, unknown> = {}) {
  return { locale: "vi", alt: "Otter Beer – Premium Lager", ...overrides };
}

function baseSlide(overrides: Record<string, unknown> = {}) {
  return {
    mediaKey: "hero/2026-08-25/uuid.jpg",
    mediaType: "image",
    status: "draft",
    translations: [viTranslation()],
    ...overrides,
  };
}

describe("HeroSlideInputSchema", () => {
  it("accepts a valid slide with only the required (vi) locale", () => {
    expect(HeroSlideInputSchema.safeParse(baseSlide()).success).toBe(true);
  });

  it("accepts a video slide", () => {
    const result = HeroSlideInputSchema.safeParse(
      baseSlide({ mediaKey: "hero/2026-08-25/uuid.mp4", mediaType: "video" })
    );
    expect(result.success).toBe(true);
  });

  it("accepts an optional mobileMediaKey", () => {
    const result = HeroSlideInputSchema.safeParse(
      baseSlide({ mobileMediaKey: "hero/2026-08-25/mobile-uuid.jpg" })
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mobileMediaKey).toBe("hero/2026-08-25/mobile-uuid.jpg");
    }
  });

  it("trims the mobileMediaKey text", () => {
    const result = HeroSlideInputSchema.safeParse(
      baseSlide({ mobileMediaKey: "  hero/mobile.jpg  " })
    );
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.mobileMediaKey).toBe("hero/mobile.jpg");
  });

  it("accepts both locales at once", () => {
    const result = HeroSlideInputSchema.safeParse(
      baseSlide({
        translations: [viTranslation(), viTranslation({ locale: "en", alt: "English alt" })],
      })
    );
    expect(result.success).toBe(true);
  });

  it("defaults mediaType to image and status to draft", () => {
    const result = HeroSlideInputSchema.safeParse({
      mediaKey: "hero/2026-08-25/uuid.jpg",
      translations: [viTranslation()],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mediaType).toBe("image");
      expect(result.data.status).toBe("draft");
    }
  });

  it("rejects a slide with no media key", () => {
    expect(HeroSlideInputSchema.safeParse(baseSlide({ mediaKey: "" })).success).toBe(false);
    const missing = HeroSlideInputSchema.safeParse({
      mediaType: "image",
      status: "draft",
      translations: [viTranslation()],
    });
    expect(missing.success).toBe(false);
  });

  it("rejects a slide missing the required vi locale", () => {
    const result = HeroSlideInputSchema.safeParse(
      baseSlide({ translations: [viTranslation({ locale: "en" })] })
    );
    expect(result.success).toBe(false);
  });

  it("rejects a duplicate locale within one slide", () => {
    const result = HeroSlideInputSchema.safeParse(
      baseSlide({ translations: [viTranslation(), viTranslation({ alt: "Khác" })] })
    );
    expect(result.success).toBe(false);
  });

  it("rejects an empty alt", () => {
    const result = HeroSlideInputSchema.safeParse(
      baseSlide({ translations: [viTranslation({ alt: "   " })] })
    );
    expect(result.success).toBe(false);
  });

  it("rejects an alt over 200 characters", () => {
    const result = HeroSlideInputSchema.safeParse(
      baseSlide({ translations: [viTranslation({ alt: "a".repeat(201) })] })
    );
    expect(result.success).toBe(false);
  });

  it("rejects an unknown media type", () => {
    expect(HeroSlideInputSchema.safeParse(baseSlide({ mediaType: "gif" })).success).toBe(false);
  });

  it("rejects an unknown status", () => {
    expect(HeroSlideInputSchema.safeParse(baseSlide({ status: "archived" })).success).toBe(false);
  });

  it("rejects an unsupported locale", () => {
    const result = HeroSlideInputSchema.safeParse(
      baseSlide({ translations: [viTranslation(), viTranslation({ locale: "fr" })] })
    );
    expect(result.success).toBe(false);
  });

  it("trims the alt text", () => {
    const result = HeroSlideInputSchema.safeParse(
      baseSlide({ translations: [viTranslation({ alt: "  Otter  " })] })
    );
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.translations[0].alt).toBe("Otter");
  });
});

describe("HeroSectionUpdateSchema", () => {
  it("accepts an empty slide list (clearing the carousel)", () => {
    const result = HeroSectionUpdateSchema.safeParse({ slides: [] });
    expect(result.success).toBe(true);
  });

  it("accepts a full carousel up to the cap", () => {
    const slides = Array.from({ length: MAX_HERO_SLIDES }, () => baseSlide());
    expect(HeroSectionUpdateSchema.safeParse({ slides }).success).toBe(true);
  });

  it("rejects more slides than the cap allows", () => {
    const slides = Array.from({ length: MAX_HERO_SLIDES + 1 }, () => baseSlide());
    expect(HeroSectionUpdateSchema.safeParse({ slides }).success).toBe(false);
  });

  it("rejects the whole payload when one slide is invalid", () => {
    const result = HeroSectionUpdateSchema.safeParse({
      slides: [baseSlide(), baseSlide({ mediaKey: "" })],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a payload with no slides key at all", () => {
    expect(HeroSectionUpdateSchema.safeParse({}).success).toBe(false);
  });
});
