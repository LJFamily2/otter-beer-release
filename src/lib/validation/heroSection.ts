import { z } from "zod";
import { SUPPORTED_LOCALE_CODES, getRequiredLocales } from "@/config/locales";
import { HERO_MEDIA_TYPES, MAX_HERO_SLIDES, HERO_SLIDE_STATUSES } from "@/config/heroSlide";

const localeEnum = z.enum(
  SUPPORTED_LOCALE_CODES as unknown as [string, ...string[]]
);

export const HeroSlideTranslationInputSchema = z.object({
  locale: localeEnum,
  alt: z
    .string({ message: "Vui lòng nhập mô tả ảnh (alt)" })
    .trim()
    .min(1, "Vui lòng nhập mô tả ảnh (alt)")
    .max(200, "Mô tả ảnh không được vượt quá 200 ký tự"),
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
      message: "Mỗi ngôn ngữ chỉ được xuất hiện một lần trong mỗi slide",
    });
  }
}

export const HeroSlideInputSchema = z
  .object({
    mediaKey: z
      .string({ message: "Vui lòng tải ảnh hoặc video cho slide này" })
      .trim()
      .min(1, "Vui lòng tải ảnh hoặc video cho slide này"),
    mobileMediaKey: z.string().trim().optional(),
    mediaType: z.enum(HERO_MEDIA_TYPES).default("image"),
    status: z.enum(HERO_SLIDE_STATUSES).default("draft"),
    translations: z
      .array(HeroSlideTranslationInputSchema)
      .min(1, "Vui lòng điền nội dung cho ít nhất một ngôn ngữ bắt buộc"),
  })
  .superRefine((data, ctx) => validateTranslationSet(data.translations, ctx));

export const HeroSectionUpdateSchema = z.object({
  slides: z
    .array(HeroSlideInputSchema)
    .max(MAX_HERO_SLIDES, `Không được vượt quá ${MAX_HERO_SLIDES} slide`),
});

export type HeroSlideInput = z.infer<typeof HeroSlideInputSchema>;
export type HeroSectionUpdateInput = z.infer<typeof HeroSectionUpdateSchema>;
