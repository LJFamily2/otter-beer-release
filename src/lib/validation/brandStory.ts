import { z } from "zod";
import { SUPPORTED_LOCALE_CODES, getRequiredLocales } from "@/config/locales";

const localeEnum = z.enum(
  SUPPORTED_LOCALE_CODES as unknown as [string, ...string[]]
);

export const BrandStoryChapterTranslationInputSchema = z.object({
  locale: localeEnum,
  title: z
    .string({ message: "Vui lòng nhập tiêu đề chương" })
    .trim()
    .min(1, "Vui lòng nhập tiêu đề chương")
    .max(80, "Tiêu đề không được vượt quá 80 ký tự"),
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
      message: "Mỗi ngôn ngữ chỉ được xuất hiện một lần trong mỗi chương",
    });
  }
}

export const BrandStoryChapterInputSchema = z
  .object({
    images: z
      .array(z.string().trim().min(1, "Đường dẫn ảnh không hợp lệ"))
      .min(1, "Vui lòng thêm ít nhất một ảnh cho chương này")
      .max(12, "Không được vượt quá 12 ảnh mỗi chương"),
    translations: z
      .array(BrandStoryChapterTranslationInputSchema)
      .min(1, "Vui lòng điền nội dung cho ít nhất một ngôn ngữ bắt buộc"),
  })
  .superRefine((data, ctx) => validateTranslationSet(data.translations, ctx));

export const BrandStoryUpdateSchema = z.object({
  chapters: z
    .array(BrandStoryChapterInputSchema)
    .max(10, "Không được vượt quá 10 chương"),
});

export type BrandStoryChapterInput = z.infer<typeof BrandStoryChapterInputSchema>;
export type BrandStoryUpdateInput = z.infer<typeof BrandStoryUpdateSchema>;
