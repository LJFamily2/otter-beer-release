import { z } from "zod";
import { SUPPORTED_LOCALE_CODES, getRequiredLocales } from "@/config/locales";
import { BEER_STATUSES } from "@/config/beer";

const localeEnum = z.enum(
  SUPPORTED_LOCALE_CODES as unknown as [string, ...string[]]
);

export const BeerTranslationInputSchema = z.object({
  locale: localeEnum,
  style: z
    .string({ message: "Vui lòng nhập dòng bia" })
    .trim()
    .min(1, "Vui lòng nhập dòng bia")
    .max(60, "Dòng bia không được vượt quá 60 ký tự"),
  headline: z
    .string({ message: "Vui lòng nhập tiêu đề" })
    .trim()
    .min(1, "Vui lòng nhập tiêu đề")
    .max(200, "Tiêu đề không được vượt quá 200 ký tự"),
  description: z
    .string({ message: "Vui lòng nhập mô tả" })
    .trim()
    .min(1, "Vui lòng nhập mô tả")
    .max(400, "Mô tả không được vượt quá 400 ký tự"),
});

export const BeerVariantNameInputSchema = z.object({
  locale: localeEnum,
  shortName: z
    .string({ message: "Vui lòng nhập tên phiên bản" })
    .trim()
    .min(1, "Vui lòng nhập tên phiên bản")
    .max(40, "Tên phiên bản không được vượt quá 40 ký tự"),
});

export const BeerVariantInputSchema = z.object({
  imageKey: z
    .string({ message: "Vui lòng tải ảnh cho phiên bản" })
    .trim()
    .min(1, "Vui lòng tải ảnh cho phiên bản"),
  names: z
    .array(BeerVariantNameInputSchema)
    .min(1, "Vui lòng nhập tên phiên bản"),
});

/**
 * Shared label-set rule: every required locale present, no locale twice.
 * Used for the main image's label and for each variant's.
 */
function validateNameSet(
  names: { locale: string }[],
  ctx: z.RefinementCtx,
  path: (string | number)[],
  subject: string
) {
  const locales = names.map((n) => n.locale);

  const missing = getRequiredLocales().filter((l) => !locales.includes(l));
  if (missing.length > 0) {
    const missingLabels = missing.map((l) =>
      l === "vi" ? "Tiếng Việt" : l === "en" ? "Tiếng Anh" : l
    );
    ctx.addIssue({
      code: "custom",
      path,
      message: `${subject}: thiếu tên ở ngôn ngữ bắt buộc: ${missingLabels.join(", ")}`,
    });
  }

  if (new Set(locales).size !== locales.length) {
    ctx.addIssue({
      code: "custom",
      path,
      message: `${subject}: mỗi ngôn ngữ chỉ được xuất hiện một lần`,
    });
  }
}

/**
 * The main image becomes the first pill as soon as a beer has variants, so
 * from that point it needs a label of its own — otherwise the row would show
 * one unnamed pill beside named ones.
 */
function validateMainImageNames(
  variants: unknown[] | undefined,
  imageNames: { locale: string }[] | undefined,
  ctx: z.RefinementCtx
) {
  if (!variants || variants.length === 0) return;
  // undefined on a partial update means "leave as-is" — the stored value
  // stands, so there is nothing to check here.
  if (imageNames === undefined) return;
  validateNameSet(imageNames, ctx, ["imageNames"], "Ảnh chính");
}

/**
 * Each variant needs a label in every required locale and may not repeat a
 * locale — same contract validateTranslationSet enforces for the beer's own
 * copy, but scoped per variant so the error points at the offending row.
 */
function validateVariantSet(
  variants: { names: { locale: string }[] }[],
  ctx: z.RefinementCtx
) {
  variants.forEach((variant, index) => {
    validateNameSet(
      variant.names,
      ctx,
      ["variants", index, "names"],
      `Phiên bản ${index + 1}`
    );
  });
}

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
      message: "Mỗi ngôn ngữ chỉ được xuất hiện một lần trong mỗi sản phẩm",
    });
  }
}

const hexColor = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Màu phải ở định dạng mã hex (VD: #002867)");

const baseFields = {
  imageKey: z.string().trim().optional(),
  abv: z
    .number({ message: "Vui lòng nhập nồng độ cồn (ABV)" })
    .min(0, "ABV không được nhỏ hơn 0")
    .max(100, "ABV không được vượt quá 100"),
  ibu: z
    .number({ message: "Vui lòng nhập độ đắng (IBU)" })
    .min(0, "IBU không được nhỏ hơn 0")
    .max(200, "IBU không được vượt quá 200"),
  shopUrl: z.string().trim().min(1).optional(),
  findLocallyUrl: z.string().trim().min(1).optional(),
  themeColor: hexColor.optional(),
  themeColorContainer: hexColor.optional(),
  isFeatured: z.boolean().default(false),
  status: z.enum(BEER_STATUSES).default("draft"),
  variants: z.array(BeerVariantInputSchema).default([]),
  imageNames: z.array(BeerVariantNameInputSchema).default([]),
};

export const BeerCreateSchema = z
  .object({
    ...baseFields,
    translations: z
      .array(BeerTranslationInputSchema)
      .min(1, "Vui lòng điền nội dung cho ít nhất một ngôn ngữ bắt buộc"),
  })
  .superRefine((data, ctx) => {
    validateTranslationSet(data.translations, ctx);
    validateVariantSet(data.variants, ctx);
    validateMainImageNames(data.variants, data.imageNames, ctx);
  });

export const BeerUpdateSchema = z
  .object({
    imageKey: z.string().trim().nullable().optional(),
    abv: baseFields.abv.optional(),
    ibu: baseFields.ibu.optional(),
    shopUrl: z.string().trim().min(1).nullable().optional(),
    findLocallyUrl: z.string().trim().min(1).nullable().optional(),
    themeColor: hexColor.nullable().optional(),
    themeColorContainer: hexColor.nullable().optional(),
    isFeatured: z.boolean().optional(),
    status: z.enum(BEER_STATUSES).optional(),
    translations: z.array(BeerTranslationInputSchema).min(1).optional(),
    variants: z.array(BeerVariantInputSchema).optional(),
    imageNames: z.array(BeerVariantNameInputSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.translations) validateTranslationSet(data.translations, ctx);
    if (data.variants) validateVariantSet(data.variants, ctx);
    validateMainImageNames(data.variants, data.imageNames, ctx);
  });

export type BeerCreateInput = z.infer<typeof BeerCreateSchema>;
export type BeerUpdateInput = z.infer<typeof BeerUpdateSchema>;
