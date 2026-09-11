import { z } from "zod";
import { SUPPORTED_LOCALE_CODES, getRequiredLocales } from "@/config/locales";
import { BLOG_POST_STATUSES } from "@/config/blogPost";

const localeEnum = z.enum(
  SUPPORTED_LOCALE_CODES as unknown as [string, ...string[]]
);

export const BlogPostTranslationInputSchema = z.object({
  locale: localeEnum,
  title: z
    .string({ message: "Vui lòng nhập tiêu đề bài viết" })
    .trim()
    .min(1, "Vui lòng nhập tiêu đề bài viết")
    .max(200, "Tiêu đề không được vượt quá 200 ký tự"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Đường dẫn chỉ bao gồm chữ cái thường, số và dấu gạch ngang")
    .optional(),
  excerpt: z
    .string({ message: "Vui lòng nhập mô tả ngắn" })
    .trim()
    .min(1, "Vui lòng nhập mô tả ngắn")
    .max(300, "Mô tả ngắn không được vượt quá 300 ký tự"),
  content: z
    .string({ message: "Vui lòng nhập nội dung bài viết" })
    .min(1, "Vui lòng nhập nội dung bài viết"),
  seoTitle: z.string().trim().max(70, "Tiêu đề SEO không được vượt quá 70 ký tự").optional(),
  seoDescription: z.string().trim().max(160, "Mô tả SEO không được vượt quá 160 ký tự").optional(),
  seoKeywords: z.array(z.string().trim().max(50)).max(20).default([]),
  ogImageKey: z.string().trim().optional(),
});

function validateTranslationSet(
  translations: { locale: string }[],
  ctx: z.RefinementCtx
) {
  const locales = translations.map((t) => t.locale);

  const missing = getRequiredLocales().filter((l) => !locales.includes(l));
  if (missing.length > 0) {
    const missingLabels = missing.map((l) => (l === "vi" ? "Tiếng Việt" : l === "en" ? "Tiếng Anh" : l));
    ctx.addIssue({
      code: "custom",
      path: ["translations"],
      message: `Thiếu nội dung ngôn ngữ bắt buộc: ${missingLabels.join(", ")}`,
    });
  }

  if (new Set(locales).size !== locales.length) {
    ctx.addIssue({
      code: "custom",
      path: ["translations"],
      message: "Mỗi ngôn ngữ chỉ được xuất hiện một lần trong mỗi bài viết",
    });
  }
}

export const BlogPostCreateSchema = z
  .object({
    coverImageKey: z.string().trim().optional(),
    tags: z.array(z.string().trim().max(30)).max(10).default([]),
    status: z.enum(BLOG_POST_STATUSES).default("draft"),
    translations: z
      .array(BlogPostTranslationInputSchema)
      .min(1, "Vui lòng điền nội dung cho ít nhất một ngôn ngữ bắt buộc"),
  })
  .superRefine((data, ctx) => validateTranslationSet(data.translations, ctx));

export const BlogPostUpdateSchema = z
  .object({
    coverImageKey: z.string().trim().nullable().optional(),
    tags: z.array(z.string().trim().max(30)).max(10).optional(),
    status: z.enum(BLOG_POST_STATUSES).optional(),
    translations: z.array(BlogPostTranslationInputSchema).min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.translations) validateTranslationSet(data.translations, ctx);
  });

export type BlogPostCreateInput = z.infer<typeof BlogPostCreateSchema>;
export type BlogPostUpdateInput = z.infer<typeof BlogPostUpdateSchema>;
