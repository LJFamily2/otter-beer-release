import {
  formatAspectRatio,
  isHeroAspectRatio,
  HERO_ASPECT_RATIO,
  HERO_MEDIA_TYPES,
  HERO_SLIDE_STATUSES,
  MAX_HERO_SLIDES,
} from "@/config/heroSlide";

describe("isHeroAspectRatio", () => {
  it("accepts exact 16:9 dimensions", () => {
    expect(isHeroAspectRatio(1920, 1080)).toBe(true);
    expect(isHeroAspectRatio(1280, 720)).toBe(true);
    expect(isHeroAspectRatio(3840, 2160)).toBe(true);
  });

  it("accepts near-16:9 dimensions inside the tolerance", () => {
    // 1366×768 is 1.7786 — the classic laptop panel, ~0.03% off 16:9.
    expect(isHeroAspectRatio(1366, 768)).toBe(true);
    // A couple of pixels lost to a crop tool shouldn't trip the warning.
    expect(isHeroAspectRatio(1918, 1080)).toBe(true);
  });

  it("rejects ratios well outside 16:9", () => {
    expect(isHeroAspectRatio(1000, 1000)).toBe(false); // square
    expect(isHeroAspectRatio(1600, 1200)).toBe(false); // 4:3
    expect(isHeroAspectRatio(1080, 1920)).toBe(false); // portrait
    expect(isHeroAspectRatio(2560, 1080)).toBe(false); // ultrawide 21:9
  });

  it("treats unmeasurable dimensions as acceptable rather than warning", () => {
    expect(isHeroAspectRatio(0, 0)).toBe(true);
    expect(isHeroAspectRatio(-1, 100)).toBe(true);
    expect(isHeroAspectRatio(100, 0)).toBe(true);
  });

  it("uses 16/9 as the target ratio", () => {
    expect(HERO_ASPECT_RATIO).toBeCloseTo(16 / 9);
  });
});

describe("formatAspectRatio", () => {
  it("reduces dimensions to their simplest ratio", () => {
    expect(formatAspectRatio(1920, 1080)).toBe("16:9");
    expect(formatAspectRatio(1600, 1200)).toBe("4:3");
    expect(formatAspectRatio(1000, 1000)).toBe("1:1");
    expect(formatAspectRatio(1080, 1920)).toBe("9:16");
  });

  it("reports unmeasurable dimensions rather than dividing by zero", () => {
    expect(formatAspectRatio(0, 0)).toBe("không xác định");
    expect(formatAspectRatio(100, 0)).toBe("không xác định");
  });
});

describe("hero slide constants", () => {
  it("offers exactly draft and published statuses", () => {
    expect(HERO_SLIDE_STATUSES).toEqual(["draft", "published"]);
  });

  it("offers exactly image and video media types", () => {
    expect(HERO_MEDIA_TYPES).toEqual(["image", "video"]);
  });

  it("caps the carousel at a sane number of slides", () => {
    expect(MAX_HERO_SLIDES).toBeGreaterThan(0);
    expect(MAX_HERO_SLIDES).toBeLessThanOrEqual(20);
  });
});
