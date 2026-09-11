import {
  BlogPostCreateSchema,
  BlogPostUpdateSchema,
} from "@/lib/validation/blogPost";

function viTranslation(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    locale: "vi",
    title: "Câu chuyện về Otter IPA",
    excerpt: "Cách chúng tôi tạo ra IPA đặc trưng.",
    content: "<p>Nội dung</p>",
    ...overrides,
  };
}

describe("BlogPostCreateSchema", () => {
  it("accepts a valid post with only the required (vi) locale", () => {
    const result = BlogPostCreateSchema.safeParse({
      translations: [viTranslation()],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a post missing the required vi locale", () => {
    const result = BlogPostCreateSchema.safeParse({
      translations: [
        {
          locale: "en",
          title: "The Story of Otter IPA",
          excerpt: "How we crafted it.",
          content: "<p>Content</p>",
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects duplicate locales in the same post", () => {
    const result = BlogPostCreateSchema.safeParse({
      translations: [viTranslation(), viTranslation()],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unsupported locale code", () => {
    const result = BlogPostCreateSchema.safeParse({
      translations: [
        { ...viTranslation({ locale: undefined }), locale: "fr" },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid slug shape when one is provided", () => {
    const result = BlogPostCreateSchema.safeParse({
      translations: [viTranslation({ slug: "Not A Valid Slug!" })],
    });
    expect(result.success).toBe(false);
  });

  it("defaults status to draft and tags to an empty array", () => {
    const result = BlogPostCreateSchema.parse({
      translations: [viTranslation()],
    });
    expect(result.status).toBe("draft");
    expect(result.tags).toEqual([]);
  });
});

describe("BlogPostUpdateSchema", () => {
  it("allows a partial update with no translations", () => {
    const result = BlogPostUpdateSchema.safeParse({ status: "published" });
    expect(result.success).toBe(true);
  });

  it("still enforces the required-locale rule when translations are provided", () => {
    const result = BlogPostUpdateSchema.safeParse({
      translations: [
        {
          locale: "en",
          title: "English only",
          excerpt: "Missing Vietnamese",
          content: "<p>...</p>",
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
