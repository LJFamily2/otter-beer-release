"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LOCALES, getRequiredLocales, type LocaleCode } from "@/config/locales";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Alert } from "@/components/ui/Alert";
import { Tabs } from "@/components/ui/Tabs";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { DEFAULT_THEME_COLOR, DEFAULT_THEME_COLOR_CONTAINER } from "@/config/beer";

interface TranslationFormState {
  style: string;
  headline: string;
  description: string;
}

function emptyTranslation(): TranslationFormState {
  return { style: "", headline: "", description: "" };
}

/**
 * One packaging option being edited. The image is shared across languages;
 * only the pill label is per-locale, mirroring how the beer's own copy is
 * stored (see src/models/Beer.ts).
 */
export interface VariantFormState {
  imageKey?: string;
  names: Partial<Record<LocaleCode, string>>;
}

function emptyVariant(): VariantFormState {
  const names: Partial<Record<LocaleCode, string>> = {};
  for (const locale of LOCALES) names[locale.code] = "";
  return { names };
}

export interface BeerFormInitialData {
  /** Per-locale label for the main image, shown as the first pill. */
  imageNames?: Partial<Record<LocaleCode, string>>;
  imageKey?: string;
  abv: number;
  ibu: number;
  shopUrl?: string;
  findLocallyUrl?: string;
  themeColor?: string;
  themeColorContainer?: string;
  isFeatured: boolean;
  status: "draft" | "published";
  translations: Partial<Record<LocaleCode, TranslationFormState>>;
  variants?: VariantFormState[];
}

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

interface BeerFormProps {
  mode: "create" | "edit";
  beerId?: string;
  initialData?: BeerFormInitialData;
}

const labelClass = "text-xs font-medium uppercase tracking-wide text-on-surface";
const fieldClass = "flex flex-col gap-1.5";
const sectionClass =
  "flex flex-col gap-4 rounded-lg border border-[rgba(196,198,210,0.3)] bg-surface-container-lowest p-6 shadow-sm";
const sectionTitleClass = "font-display text-lg tracking-wide text-primary";

const STATUS_OPTIONS = [
  { value: "draft", label: "Bản nháp" },
  { value: "published", label: "Xuất bản" },
];

export function BeerForm({ mode, beerId, initialData }: BeerFormProps) {
  const router = useRouter();
  const [activeLocale, setActiveLocale] = useState<LocaleCode>(LOCALES[0].code);
  const [imageKey, setImageKey] = useState(initialData?.imageKey);
  const [abvInput, setAbvInput] = useState(initialData?.abv?.toString() ?? "");
  const [ibuInput, setIbuInput] = useState(initialData?.ibu?.toString() ?? "");
  const [shopUrl, setShopUrl] = useState(initialData?.shopUrl ?? "");
  const [findLocallyUrl, setFindLocallyUrl] = useState(initialData?.findLocallyUrl ?? "");
  const [themeColor, setThemeColor] = useState(initialData?.themeColor ?? "");
  const [themeColorContainer, setThemeColorContainer] = useState(
    initialData?.themeColorContainer ?? ""
  );
  const [isFeatured, setIsFeatured] = useState(initialData?.isFeatured ?? false);
  const [status, setStatus] = useState<"draft" | "published">(initialData?.status ?? "draft");
  const [translations, setTranslations] = useState<
    Record<LocaleCode, TranslationFormState>
  >(() => {
    const initial = {} as Record<LocaleCode, TranslationFormState>;
    for (const locale of LOCALES) {
      initial[locale.code] = initialData?.translations[locale.code] ?? emptyTranslation();
    }
    return initial;
  });
  const [imageNames, setImageNames] = useState<Partial<Record<LocaleCode, string>>>(
    () => ({ ...emptyVariant().names, ...(initialData?.imageNames ?? {}) })
  );
  const [variants, setVariants] = useState<VariantFormState[]>(() =>
    (initialData?.variants ?? []).map((variant) => ({
      imageKey: variant.imageKey,
      names: { ...emptyVariant().names, ...variant.names },
    }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function updateTranslation(locale: LocaleCode, patch: Partial<TranslationFormState>) {
    const patchKeys = Object.keys(patch);
    setFieldErrors((prev) => {
      const next = { ...prev };
      for (const k of patchKeys) delete next[k];
      return next;
    });
    setTranslations((prev) => ({ ...prev, [locale]: { ...prev[locale], ...patch } }));
  }

  function addVariant() {
    setVariants((prev) => [...prev, emptyVariant()]);
  }

  function removeVariant(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  function updateVariant(index: number, patch: Partial<VariantFormState>) {
    setVariants((prev) =>
      prev.map((variant, i) => (i === index ? { ...variant, ...patch } : variant))
    );
  }

  function updateVariantName(index: number, locale: LocaleCode, value: string) {
    setVariants((prev) =>
      prev.map((variant, i) =>
        i === index ? { ...variant, names: { ...variant.names, [locale]: value } } : variant
      )
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrors([]);
    setSuccessMessage(null);
    setFieldErrors({});

    const requiredLocales = getRequiredLocales();
    const validationErrors: string[] = [];
    const newFieldErrors: Record<string, string> = {};

    for (const localeCode of requiredLocales) {
      const localeConfig = LOCALES.find((l) => l.code === localeCode);
      const localeLabel = localeConfig?.label ?? localeCode;
      const t = translations[localeCode as LocaleCode];

      if (!t.style.trim()) {
        validationErrors.push(`Cần nhập dòng bia (${localeLabel}).`);
        if (localeCode === activeLocale) newFieldErrors.style = "Cần nhập dòng bia";
      }
      if (!t.headline.trim()) {
        validationErrors.push(`Cần nhập tiêu đề (${localeLabel}).`);
        if (localeCode === activeLocale) newFieldErrors.headline = "Cần nhập tiêu đề";
      }
      if (!t.description.trim()) {
        validationErrors.push(`Cần nhập mô tả (${localeLabel}).`);
        if (localeCode === activeLocale) newFieldErrors.description = "Cần nhập mô tả";
      }
    }

    const abv = Number(abvInput);
    if (!abvInput.trim() || Number.isNaN(abv)) {
      validationErrors.push("Cần nhập nồng độ cồn (ABV) hợp lệ.");
      newFieldErrors.abv = "Cần nhập ABV hợp lệ";
    }
    const ibu = Number(ibuInput);
    if (!ibuInput.trim() || Number.isNaN(ibu)) {
      validationErrors.push("Cần nhập độ đắng (IBU) hợp lệ.");
      newFieldErrors.ibu = "Cần nhập IBU hợp lệ";
    }

    if (themeColor.trim() && !HEX_COLOR_PATTERN.test(themeColor.trim())) {
      validationErrors.push("Màu chính không hợp lệ, cần đúng định dạng mã hex (VD: #002867).");
      newFieldErrors.themeColor = "Mã hex không hợp lệ";
    }
    if (themeColorContainer.trim() && !HEX_COLOR_PATTERN.test(themeColorContainer.trim())) {
      validationErrors.push("Màu nền không hợp lệ, cần đúng định dạng mã hex (VD: #1d3f82).");
      newFieldErrors.themeColorContainer = "Mã hex không hợp lệ";
    }

    if (variants.length > 0) {
      for (const localeCode of requiredLocales) {
        const localeLabel =
          LOCALES.find((l) => l.code === localeCode)?.label ?? localeCode;
        if (!(imageNames[localeCode as LocaleCode] ?? "").trim()) {
          validationErrors.push(
            `Ảnh chính: cần nhập tên ngắn (${localeLabel}) khi sản phẩm có phiên bản.`
          );
        }
      }
    }

    variants.forEach((variant, index) => {
      if (!variant.imageKey) {
        validationErrors.push(`Phiên bản ${index + 1}: cần tải ảnh.`);
      }
      for (const localeCode of requiredLocales) {
        const localeLabel =
          LOCALES.find((l) => l.code === localeCode)?.label ?? localeCode;
        if (!(variant.names[localeCode as LocaleCode] ?? "").trim()) {
          validationErrors.push(
            `Phiên bản ${index + 1}: cần nhập tên (${localeLabel}).`
          );
        }
      }
    });

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setFieldErrors(newFieldErrors);
      setActiveLocale(requiredLocales[0] as LocaleCode);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const activeTranslations = LOCALES.filter(
      (locale) => translations[locale.code].style.trim().length > 0
    ).map((locale) => {
      const t = translations[locale.code];
      return {
        locale: locale.code,
        style: t.style.trim(),
        headline: t.headline.trim(),
        description: t.description.trim(),
      };
    });

    const payload = {
      imageKey,
      abv,
      ibu,
      shopUrl: shopUrl.trim() || undefined,
      findLocallyUrl: findLocallyUrl.trim() || undefined,
      themeColor: themeColor.trim() || undefined,
      themeColorContainer: themeColorContainer.trim() || undefined,
      isFeatured,
      status,
      translations: activeTranslations,
      imageNames: LOCALES.filter(
        (locale) => (imageNames[locale.code] ?? "").trim().length > 0
      ).map((locale) => ({
        locale: locale.code,
        shortName: (imageNames[locale.code] ?? "").trim(),
      })),
      variants: variants.map((variant) => ({
        imageKey: variant.imageKey,
        names: LOCALES.filter(
          (locale) => (variant.names[locale.code] ?? "").trim().length > 0
        ).map((locale) => ({
          locale: locale.code,
          shortName: (variant.names[locale.code] ?? "").trim(),
        })),
      })),
    };

    setIsSubmitting(true);
    try {
      const response = await fetch(
        mode === "create" ? "/api/beers" : `/api/beers/${beerId}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        if (response.status === 400 && body?.details) {
          const serverErrors: string[] = [];
          if (typeof body.error === "string" && !body.error.includes("không hợp lệ")) {
            serverErrors.push(body.error);
          } else {
            serverErrors.push("Dữ liệu không hợp lệ. Vui lòng điền đầy đủ các thông tin bắt buộc.");
          }
          if (body.details.formErrors?.length) serverErrors.push(...body.details.formErrors);
          if (body.details.fieldErrors) {
            for (const [, errs] of Object.entries(body.details.fieldErrors)) {
              if (Array.isArray(errs)) serverErrors.push(...(errs as string[]));
            }
          }
          setErrors(serverErrors);
        } else {
          setErrors([body?.error ?? "Không thể lưu sản phẩm. Vui lòng thử lại."]);
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      // Stay on the form rather than bouncing back to the list, so an editor
      // can keep working on the same product after saving.
      if (mode === "create") {
        // There is no edit page to stay on yet — hand over to the new
        // product's own so the next save PATCHes instead of creating a
        // second copy.
        const created = await response.json().catch(() => null);
        const newId = created?._id ? String(created._id) : null;
        if (newId) {
          router.replace(`/admin/beers/${newId}/sua`);
          router.refresh();
          return;
        }
        router.push("/admin/beers");
        router.refresh();
        return;
      }

      setSuccessMessage("Đã lưu thay đổi.");
      router.refresh();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setErrors([err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định."]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  }

  const active = translations[activeLocale];
  const isRequiredLocale = LOCALES.find((l) => l.code === activeLocale)?.required ?? false;
  const pageTitle = mode === "create" ? "Tạo sản phẩm mới" : "Chỉnh sửa sản phẩm";

  return (
    <form
      className="flex max-w-[860px] flex-col gap-8 pb-12"
      onSubmit={handleSubmit}
      // Any edit invalidates the "saved" banner — leaving it up while there
      // are unsaved changes would misreport the form's state.
      onChange={() => setSuccessMessage(null)}
    >
      <div className="flex flex-col gap-3 border-b border-[rgba(196,198,210,0.3)] pb-4">
        <Breadcrumbs
          items={[
            { label: "Quản trị", href: "/admin" },
            { label: "Sản phẩm bia", href: "/admin/beers" },
            { label: mode === "create" ? "Tạo sản phẩm" : "Chỉnh sửa sản phẩm" },
          ]}
        />
        <h1 className="text-[32px] tracking-wide text-primary">{pageTitle}</h1>
      </div>

      {successMessage ? (
        <Alert variant="success" title={successMessage} />
      ) : null}

      {errors.length > 0 ? (
        <div className="rounded-lg bg-error-container p-4 text-on-error-container shadow-sm">
          <div className="font-semibold text-base">
            Vui lòng kiểm tra và điền đầy đủ các thông tin sau:
          </div>
          <ul className="mt-2 list-inside list-disc flex flex-col gap-1 text-sm">
            {errors.map((msg, index) => (
              <li key={index}>{msg}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <Card className={sectionClass}>
        <h2 className={sectionTitleClass}>Nội dung theo ngôn ngữ</h2>
        <Tabs
          variant="pill"
          value={activeLocale}
          onChange={(value) => setActiveLocale(value as LocaleCode)}
          items={LOCALES.map((locale) => ({
            value: locale.code,
            label: locale.required ? (
              <>
                {locale.label} <span className="text-error font-bold">*</span>
              </>
            ) : (
              locale.label
            ),
          }))}
        />

        <Input
          label={
            <>
              Dòng bia {isRequiredLocale ? <span className="text-error font-bold">*</span> : null}
            </>
          }
          id="style"
          placeholder="VD: PREMIUM LAGER"
          value={active.style}
          error={fieldErrors.style}
          onChange={(e) => updateTranslation(activeLocale, { style: e.target.value })}
          required={isRequiredLocale}
        />

        <Textarea
          label={
            <>
              Tiêu đề {isRequiredLocale ? <span className="text-error font-bold">*</span> : null}
            </>
          }
          id="headline"
          placeholder={"VD: BREWING\nCONNECTIONS."}
          value={active.headline}
          error={fieldErrors.headline}
          onChange={(e) => updateTranslation(activeLocale, { headline: e.target.value })}
          hint="Xuống dòng sẽ được giữ nguyên khi hiển thị."
        />

        <Textarea
          label={
            <>
              Mô tả {isRequiredLocale ? <span className="text-error font-bold">*</span> : null}
            </>
          }
          id="description"
          placeholder="Nhập mô tả ngắn về sản phẩm..."
          maxLength={400}
          value={active.description}
          error={fieldErrors.description}
          onChange={(e) => updateTranslation(activeLocale, { description: e.target.value })}
          hint={`${active.description.length}/400`}
        />
      </Card>

      <Card className={sectionClass}>
        <h2 className={sectionTitleClass}>Thông số & Ảnh</h2>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="ABV (%)"
            id="abv"
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={abvInput}
            error={fieldErrors.abv}
            onChange={(e) => setAbvInput(e.target.value)}
          />
          <Input
            label="IBU"
            id="ibu"
            type="number"
            step="1"
            min="0"
            max="200"
            value={ibuInput}
            error={fieldErrors.ibu}
            onChange={(e) => setIbuInput(e.target.value)}
          />
        </div>
        <div className={fieldClass}>
          <label className={labelClass}>Ảnh sản phẩm</label>
          <ImageUploadField imageKey={imageKey} onChange={setImageKey} namespace="beers" />
        </div>
      </Card>

      <Card className={sectionClass}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className={sectionTitleClass}>Phiên bản sản phẩm</h2>
            <p className="max-w-[520px] text-sm text-on-surface-variant">
              Mỗi phiên bản là một biến thể của sản phẩm với ảnh riêng — ví dụ quy cách
              đóng gói (lon, bao bì 6 lon, thùng 24 lon). Mỗi phiên bản thêm vào đây sẽ
              hiện thành một nút chọn ngay dưới ảnh trên trang chủ. Để trống nếu sản
              phẩm chỉ có một ảnh — khi đó ảnh sản phẩm ở trên được dùng.
            </p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={addVariant}>
            Thêm phiên bản
          </Button>
        </div>

        {variants.length > 0 ? (
          <div className="flex flex-col gap-4 rounded border border-[rgba(196,198,210,0.5)] bg-surface p-4">
            <div className="flex items-center justify-between gap-4">
              <span className={labelClass}>Ảnh chính (nút đầu tiên)</span>
              <span className="text-xs text-on-surface-variant">
                Ảnh lấy từ mục “Thông số & Ảnh” ở trên
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {LOCALES.map((locale) => (
                <Input
                  key={locale.code}
                  label={
                    <>
                      Tên ngắn ({locale.label}){" "}
                      {locale.required ? (
                        <span className="text-error font-bold">*</span>
                      ) : null}
                    </>
                  }
                  id={`main-image-name-${locale.code}`}
                  maxLength={40}
                  placeholder={locale.code === "en" ? "VD: CAN" : "VD: LON"}
                  value={imageNames[locale.code] ?? ""}
                  onChange={(e) =>
                    setImageNames((prev) => ({ ...prev, [locale.code]: e.target.value }))
                  }
                />
              ))}
            </div>
          </div>
        ) : null}

        {variants.length === 0 ? (
          <p className="rounded border border-dashed border-[rgba(196,198,210,0.7)] bg-surface p-4 text-sm text-on-surface-variant">
            Chưa có phiên bản nào.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {variants.map((variant, index) => (
              <div
                key={index}
                className="flex flex-col gap-4 rounded border border-[rgba(196,198,210,0.5)] bg-surface p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className={labelClass}>Phiên bản {index + 1}</span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => removeVariant(index)}
                  >
                    Xóa
                  </Button>
                </div>

                <ImageUploadField
                  imageKey={variant.imageKey}
                  onChange={(key) => updateVariant(index, { imageKey: key })}
                  namespace="beers"
                />

                <div className="grid grid-cols-2 gap-4">
                  {LOCALES.map((locale) => (
                    <Input
                      key={locale.code}
                      label={
                        <>
                          Tên ngắn ({locale.label}){" "}
                          {locale.required ? (
                            <span className="text-error font-bold">*</span>
                          ) : null}
                        </>
                      }
                      id={`variant-${index}-name-${locale.code}`}
                      maxLength={40}
                      placeholder={locale.code === "en" ? "VD: 6-PACK" : "VD: BAO BÌ 6 LON"}
                      value={variant.names[locale.code] ?? ""}
                      onChange={(e) => updateVariantName(index, locale.code, e.target.value)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className={sectionClass}>
        <h2 className={sectionTitleClass}>Liên kết & Hiển thị</h2>
        <Input
          label="Liên kết Mua ngay"
          id="shopUrl"
          placeholder="https://..."
          value={shopUrl}
          onChange={(e) => setShopUrl(e.target.value)}
        />
        <Input
          label="Liên kết Tìm cửa hàng"
          id="findLocallyUrl"
          placeholder="https://..."
          value={findLocallyUrl}
          onChange={(e) => setFindLocallyUrl(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-4">
          <div className={fieldClass}>
            <label className={labelClass} htmlFor="themeColor">
              Màu chính (trên trang chủ)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                aria-label="Chọn màu chính"
                value={
                  HEX_COLOR_PATTERN.test(themeColor.trim())
                    ? themeColor.trim()
                    : DEFAULT_THEME_COLOR
                }
                onChange={(e) => setThemeColor(e.target.value)}
                className="h-[46px] w-14 shrink-0 cursor-pointer rounded-sm border border-outline-variant bg-surface-container-lowest p-1"
              />
              <Input
                id="themeColor"
                placeholder={DEFAULT_THEME_COLOR}
                value={themeColor}
                error={fieldErrors.themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                wrapperClassName="flex-1"
              />
            </div>
          </div>
          <div className={fieldClass}>
            <label className={labelClass} htmlFor="themeColorContainer">
              Màu nền (trên trang chủ)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                aria-label="Chọn màu nền"
                value={
                  HEX_COLOR_PATTERN.test(themeColorContainer.trim())
                    ? themeColorContainer.trim()
                    : DEFAULT_THEME_COLOR_CONTAINER
                }
                onChange={(e) => setThemeColorContainer(e.target.value)}
                className="h-[46px] w-14 shrink-0 cursor-pointer rounded-sm border border-outline-variant bg-surface-container-lowest p-1"
              />
              <Input
                id="themeColorContainer"
                placeholder={DEFAULT_THEME_COLOR_CONTAINER}
                value={themeColorContainer}
                error={fieldErrors.themeColorContainer}
                onChange={(e) => setThemeColorContainer(e.target.value)}
                wrapperClassName="flex-1"
              />
            </div>
          </div>
        </div>
        <Checkbox
          label="Hiển thị làm sản phẩm nổi bật trên trang chủ"
          checked={isFeatured}
          onChange={(e) => setIsFeatured(e.target.checked)}
        />
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Select
          label="Trạng thái"
          id="status"
          value={status}
          onChange={(v) => setStatus(v as "draft" | "published")}
          options={STATUS_OPTIONS}
          wrapperClassName="w-56"
        />
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={() => router.push("/admin/beers")}>
            Hủy
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Đang lưu..." : "Lưu sản phẩm"}
          </Button>
        </div>
      </div>
    </form>
  );
}
