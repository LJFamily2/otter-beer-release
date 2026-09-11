import { SlugGenerator } from "@/lib/utils/SlugGenerator";

describe("SlugGenerator.generate", () => {
  it("strips Vietnamese diacritics and lowercases", () => {
    expect(SlugGenerator.generate("Câu chuyện về Otter IPA")).toBe(
      "cau-chuyen-ve-otter-ipa"
    );
  });

  it("handles đ/Đ which has no Unicode decomposition", () => {
    expect(SlugGenerator.generate("Đặc biệt")).toBe("dac-biet");
  });

  it("collapses punctuation and repeated separators into single dashes", () => {
    expect(SlugGenerator.generate("Ưu Đãi Mùa Hè - Giảm Giá 50%!")).toBe(
      "uu-dai-mua-he-giam-gia-50"
    );
  });

  it("trims leading/trailing dashes", () => {
    expect(SlugGenerator.generate("  Hello World!!  ")).toBe("hello-world");
  });
});

describe("SlugGenerator.generateUnique", () => {
  it("returns the base slug when it is free", async () => {
    const slug = await SlugGenerator.generateUnique(
      "Otter IPA",
      async () => false
    );
    expect(slug).toBe("otter-ipa");
  });

  it("appends -2, -3, ... until a free slug is found", async () => {
    const taken = new Set(["otter-ipa", "otter-ipa-2", "otter-ipa-3"]);
    const slug = await SlugGenerator.generateUnique("Otter IPA", async (c) =>
      taken.has(c)
    );
    expect(slug).toBe("otter-ipa-4");
  });

  it("falls back to a default base when the title has no ASCII characters", async () => {
    const slug = await SlugGenerator.generateUnique("!!!", async () => false);
    expect(slug).toBe("bai-viet");
  });
});
