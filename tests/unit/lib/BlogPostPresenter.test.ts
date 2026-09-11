import { pickTranslation, toNewsCardItem } from "@/lib/utils/BlogPostPresenter";
import type { IBlogPost } from "@/models/BlogPost";

function post(locales: string[]) {
  return {
    translations: locales.map((locale) => ({
      locale,
      title: `title-${locale}`,
      slug: `slug-${locale}`,
      excerpt: "",
      content: "",
      seoKeywords: [],
    })),
  };
}

function fullPost(overrides: Partial<IBlogPost> = {}): IBlogPost {
  return {
    _id: "post-1",
    tags: [],
    translations: [
      { locale: "vi", title: "Tiêu đề", slug: "tieu-de", excerpt: "", content: "", seoKeywords: [] },
    ],
    ...overrides,
  } as unknown as IBlogPost;
}

describe("pickTranslation", () => {
  it("returns the exact-locale translation when it exists", () => {
    const result = pickTranslation(post(["vi", "en"]), "en");
    expect(result?.locale).toBe("en");
  });

  it("falls back to the default locale (vi) when the requested one is missing", () => {
    const result = pickTranslation(post(["vi"]), "en");
    expect(result?.locale).toBe("vi");
  });

  it("falls back to whatever exists if even the default locale is missing", () => {
    const result = pickTranslation(post(["fr"]), "en");
    expect(result?.locale).toBe("fr");
  });

  it("returns null for a post with no translations", () => {
    const result = pickTranslation(post([]), "vi");
    expect(result).toBeNull();
  });
});

describe("toNewsCardItem", () => {
  it("maps a post's fields to the news card shape for the requested locale", () => {
    const item = toNewsCardItem(
      fullPost({
        coverImageKey: "news-blog/cover.jpg",
        tags: ["Hậu trường", "Behind the Scenes"],
        publishedAt: new Date("2026-05-12T00:00:00Z"),
        translations: [
          { locale: "vi", title: "Tiêu đề", slug: "tieu-de", excerpt: "", content: "", seoKeywords: [] },
        ],
      }),
      "vi"
    );

    expect(item).toEqual({
      id: "post-1",
      imageSrc: "/api/media/public/news-blog/cover.jpg",
      title: "Tiêu đề",
      tag: "Hậu trường",
      href: "/blog/tieu-de",
    });
  });

  it("locale-prefixes the href for a non-default locale", () => {
    const item = toNewsCardItem(fullPost({ coverImageKey: "news-blog/cover.jpg" }), "en");
    expect(item?.href).toBe("/en/blog/tieu-de");
  });

  it("returns null when coverImageKey is unset", () => {
    const item = toNewsCardItem(fullPost(), "vi");
    expect(item).toBeNull();
  });

  it("omits the tag when the post has none", () => {
    const item = toNewsCardItem(fullPost({ tags: [] }), "vi");
    expect(item?.tag).toBeUndefined();
  });

  it("returns null when the post has no translation at all", () => {
    const item = toNewsCardItem(fullPost({ translations: [] }), "vi");
    expect(item).toBeNull();
  });
});
