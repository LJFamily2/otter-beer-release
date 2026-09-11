"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { LOCALES, getRequiredLocales, type LocaleCode } from "@/config/locales";
import { MAX_HERO_SLIDES, type HeroMediaType, type HeroSlideStatus } from "@/config/heroSlide";
import { MediaUploadField } from "@/components/admin/MediaUploadField";
import { PlusIcon, TrashIcon } from "@/components/admin/icons";
import { rowActionButtonClass } from "@/components/admin/classNames";
import { ChevronDownIcon } from "@/components/ui/icons";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";

export interface HeroSlideFormState {
  /** React key only — slides have no id, this collection is replaced whole on save. */
  key: string;
  mediaKey?: string;
  mobileMediaKey?: string;
  mediaType: HeroMediaType;
  status: HeroSlideStatus;
  translations: Record<LocaleCode, { alt: string }>;
}

function emptyTranslations(): Record<LocaleCode, { alt: string }> {
  const translations = {} as Record<LocaleCode, { alt: string }>;
  for (const locale of LOCALES) translations[locale.code] = { alt: "" };
  return translations;
}

interface HeroSlidesFormProps {
  initialSlides: HeroSlideFormState[];
  canEdit: boolean;
}

const sectionTitleClass = "font-display text-lg tracking-wide text-primary";
const labelClass = "text-xs font-medium uppercase tracking-wide text-on-surface";

const STATUS_OPTIONS = [
  { value: "draft", label: "Bản nháp" },
  { value: "published", label: "Xuất bản" },
];

export function HeroSlidesForm({ initialSlides, canEdit }: HeroSlidesFormProps) {
  const router = useRouter();
  const nextKeyRef = useRef(0);
  const [activeLocale, setActiveLocale] = useState<LocaleCode>(LOCALES[0].code);
  const [slides, setSlides] = useState<HeroSlideFormState[]>(initialSlides);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  function addSlide() {
    const key = `new-${nextKeyRef.current++}`;
    setSlides((prev) => [
      ...prev,
      {
        key,
        mediaKey: undefined,
        mobileMediaKey: undefined,
        mediaType: "image",
        status: "draft",
        translations: emptyTranslations(),
      },
    ]);
    setSaved(false);
  }

  function removeSlide(key: string) {
    setSlides((prev) => prev.filter((s) => s.key !== key));
    setSaved(false);
  }

  function moveSlide(key: string, direction: -1 | 1) {
    setSlides((prev) => {
      const index = prev.findIndex((s) => s.key === key);
      const target = index + direction;
      if (index === -1 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setSaved(false);
  }

  function updateSlideMedia(
    key: string,
    value: { key: string; mediaType: HeroMediaType } | undefined
  ) {
    setSlides((prev) =>
      prev.map((s) =>
        s.key === key
          ? {
              ...s,
              mediaKey: value?.key,
              mediaType: value?.mediaType ?? "image",
            }
          : s
      )
    );
    setSaved(false);
  }

  function updateSlideMobileMedia(
    key: string,
    value: { key: string; mediaType: HeroMediaType } | undefined
  ) {
    setSlides((prev) =>
      prev.map((s) =>
        s.key === key
          ? {
              ...s,
              mobileMediaKey: value?.key,
            }
          : s
      )
    );
    setSaved(false);
  }

  function updateSlideStatus(key: string, status: HeroSlideStatus) {
    setSlides((prev) => prev.map((s) => (s.key === key ? { ...s, status } : s)));
    setSaved(false);
  }

  function updateSlideAlt(key: string, locale: LocaleCode, alt: string) {
    setSlides((prev) =>
      prev.map((s) =>
        s.key === key
          ? { ...s, translations: { ...s.translations, [locale]: { alt } } }
          : s
      )
    );
    setSaved(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErrors([]);
    setSaved(false);

    const requiredLocales = getRequiredLocales();
    const validationErrors: string[] = [];

    if (slides.length > MAX_HERO_SLIDES) {
      validationErrors.push(`Không được vượt quá ${MAX_HERO_SLIDES} slide.`);
    }

    slides.forEach((slide, index) => {
      if (!slide.mediaKey) {
        validationErrors.push(`Slide ${index + 1}: cần tải ảnh hoặc video.`);
      }
      for (const localeCode of requiredLocales) {
        const localeConfig = LOCALES.find((l) => l.code === localeCode);
        const localeLabel = localeConfig?.label ?? localeCode;
        const t = slide.translations[localeCode as LocaleCode];
        if (!t.alt.trim()) {
          validationErrors.push(
            `Slide ${index + 1}: cần nhập mô tả ảnh — alt (${localeLabel}).`
          );
        }
      }
    });

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const payload = {
      slides: slides.map((slide) => ({
        mediaKey: slide.mediaKey,
        mobileMediaKey: slide.mobileMediaKey,
        mediaType: slide.mediaType,
        status: slide.status,
        translations: LOCALES.filter(
          (locale) => slide.translations[locale.code].alt.trim().length > 0
        ).map((locale) => ({
          locale: locale.code,
          alt: slide.translations[locale.code].alt.trim(),
        })),
      })),
    };

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/hero-section", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const serverErrors: string[] = [];
        if (body?.details?.formErrors?.length) serverErrors.push(...body.details.formErrors);
        if (body?.details?.fieldErrors) {
          for (const [, errs] of Object.entries(body.details.fieldErrors)) {
            if (Array.isArray(errs)) serverErrors.push(...(errs as string[]));
          }
        }
        setErrors(
          serverErrors.length > 0 ? serverErrors : [body?.error ?? "Không thể lưu. Vui lòng thử lại."]
        );
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      setSaved(true);
      router.refresh();
    } catch (err) {
      setErrors([err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định."]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="flex flex-col gap-8" onSubmit={handleSubmit}>
      {errors.length > 0 ? (
        <div className="rounded-lg bg-error-container p-4 text-on-error-container shadow-sm">
          <div className="text-base font-semibold">
            Vui lòng kiểm tra và điền đầy đủ các thông tin sau:
          </div>
          <ul className="mt-2 flex list-inside list-disc flex-col gap-1 text-sm">
            {errors.map((msg, index) => (
              <li key={index}>{msg}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <Tabs
        variant="pill"
        value={activeLocale}
        onChange={(value) => setActiveLocale(value as LocaleCode)}
        items={LOCALES.map((locale) => ({
          value: locale.code,
          label: locale.required ? (
            <>
              {locale.label} <span className="font-bold text-error">*</span>
            </>
          ) : (
            locale.label
          ),
        }))}
      />

      {slides.length === 0 ? (
        <Card className="p-8 text-center text-sm text-on-surface-variant">
          Chưa có slide nào. Nhấn &quot;Thêm slide&quot; để bắt đầu.
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {slides.map((slide, index) => {
            const t = slide.translations[activeLocale];
            const isRequiredLocale =
              LOCALES.find((l) => l.code === activeLocale)?.required ?? false;
            return (
              <Card key={slide.key} className="flex flex-col gap-4 p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <h2 className={sectionTitleClass}>Slide {index + 1}</h2>
                    <Badge variant={slide.status === "published" ? "primary" : "neutral"}>
                      {slide.status === "published" ? "Đã xuất bản" : "Bản nháp"}
                    </Badge>
                    {slide.mediaKey ? (
                      <Badge variant="neutral">
                        {slide.mediaType === "video" ? "Video" : "Ảnh"}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className={rowActionButtonClass}
                      aria-label={`Di chuyển slide ${index + 1} lên`}
                      disabled={index === 0}
                      onClick={() => moveSlide(slide.key, -1)}
                    >
                      <ChevronDownIcon width={15} height={15} className="rotate-180" />
                    </button>
                    <button
                      type="button"
                      className={rowActionButtonClass}
                      aria-label={`Di chuyển slide ${index + 1} xuống`}
                      disabled={index === slides.length - 1}
                      onClick={() => moveSlide(slide.key, 1)}
                    >
                      <ChevronDownIcon width={15} height={15} />
                    </button>
                    <button
                      type="button"
                      className={rowActionButtonClass}
                      aria-label={`Xóa slide ${index + 1}`}
                      onClick={() => removeSlide(slide.key)}
                    >
                      <TrashIcon width={15} height={15} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Ảnh/Video Desktop (16:9)</label>
                    <MediaUploadField
                      mediaKey={slide.mediaKey}
                      mediaType={slide.mediaType}
                      onChange={(value) => updateSlideMedia(slide.key, value)}
                      namespace="hero"
                      allowVideo
                      warnOnNon16x9
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Ảnh Mobile (9:16)</label>
                    <MediaUploadField
                      mediaKey={slide.mobileMediaKey}
                      mediaType="image"
                      onChange={(value) => updateSlideMobileMedia(slide.key, value)}
                      namespace="hero"
                      allowVideo={false}
                      aspectRatio="9/16"
                    />
                  </div>
                </div>

                <Input
                  label={
                    <>
                      Mô tả ảnh (alt){" "}
                      {isRequiredLocale ? <span className="font-bold text-error">*</span> : null}
                    </>
                  }
                  id={`alt-${slide.key}`}
                  placeholder="VD: Otter Beer – Premium Lager"
                  value={t.alt}
                  onChange={(e) => updateSlideAlt(slide.key, activeLocale, e.target.value)}
                  required={isRequiredLocale}
                  hint="Đọc cho trình đọc màn hình khi slide hiển thị."
                />

                <Select
                  label="Trạng thái slide"
                  id={`status-${slide.key}`}
                  value={slide.status}
                  onChange={(v) => updateSlideStatus(slide.key, v as HeroSlideStatus)}
                  options={STATUS_OPTIONS}
                  wrapperClassName="w-56"
                />
              </Card>
            );
          })}
        </div>
      )}

      {canEdit ? (
        <div className="flex flex-wrap items-center gap-4">
          <Button
            type="button"
            variant="secondary"
            onClick={addSlide}
            disabled={slides.length >= MAX_HERO_SLIDES}
          >
            <PlusIcon width={14} height={14} />
            Thêm slide
          </Button>
          <div className="ml-auto flex items-center gap-4">
            {saved ? <p className="text-sm text-[#10b981]">Đã lưu.</p> : null}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </div>
      ) : null}
    </form>
  );
}
