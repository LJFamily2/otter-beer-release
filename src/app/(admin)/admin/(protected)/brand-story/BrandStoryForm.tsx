"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { LOCALES, getRequiredLocales, type LocaleCode } from "@/config/locales";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { PlusIcon, TrashIcon } from "@/components/admin/icons";
import { rowActionButtonClass } from "@/components/admin/classNames";
import { ChevronDownIcon } from "@/components/ui/icons";
import { publicMediaUrl } from "@/lib/storage/constants";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";

export interface BrandStoryChapterFormState {
  /** React key only — chapters have no id, this collection is replaced whole on save. */
  key: string;
  images: string[];
  translations: Record<LocaleCode, { title: string }>;
}

function emptyTranslations(): Record<LocaleCode, { title: string }> {
  const translations = {} as Record<LocaleCode, { title: string }>;
  for (const locale of LOCALES) translations[locale.code] = { title: "" };
  return translations;
}

interface BrandStoryFormProps {
  initialChapters: BrandStoryChapterFormState[];
  canEdit: boolean;
}

const sectionTitleClass = "font-display text-lg tracking-wide text-primary";
const labelClass = "text-xs font-medium uppercase tracking-wide text-on-surface";

export function BrandStoryForm({ initialChapters, canEdit }: BrandStoryFormProps) {
  const router = useRouter();
  const nextKeyRef = useRef(0);
  const [activeLocale, setActiveLocale] = useState<LocaleCode>(LOCALES[0].code);
  const [chapters, setChapters] = useState<BrandStoryChapterFormState[]>(initialChapters);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  function addChapter() {
    const key = `new-${nextKeyRef.current++}`;
    setChapters((prev) => [...prev, { key, images: [], translations: emptyTranslations() }]);
    setSaved(false);
  }

  function removeChapter(key: string) {
    setChapters((prev) => prev.filter((c) => c.key !== key));
    setSaved(false);
  }

  function moveChapter(key: string, direction: -1 | 1) {
    setChapters((prev) => {
      const index = prev.findIndex((c) => c.key === key);
      const target = index + direction;
      if (index === -1 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setSaved(false);
  }

  function updateChapterTitle(key: string, locale: LocaleCode, title: string) {
    setChapters((prev) =>
      prev.map((c) =>
        c.key === key
          ? { ...c, translations: { ...c.translations, [locale]: { title } } }
          : c
      )
    );
    setSaved(false);
  }

  function addImage(key: string, imageKey: string) {
    setChapters((prev) =>
      prev.map((c) => (c.key === key ? { ...c, images: [...c.images, imageKey] } : c))
    );
    setSaved(false);
  }

  function removeImage(key: string, index: number) {
    setChapters((prev) =>
      prev.map((c) =>
        c.key === key ? { ...c, images: c.images.filter((_, i) => i !== index) } : c
      )
    );
    setSaved(false);
  }

  function moveImage(key: string, index: number, direction: -1 | 1) {
    setChapters((prev) =>
      prev.map((c) => {
        if (c.key !== key) return c;
        const target = index + direction;
        if (target < 0 || target >= c.images.length) return c;
        const images = [...c.images];
        [images[index], images[target]] = [images[target], images[index]];
        return { ...c, images };
      })
    );
    setSaved(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErrors([]);
    setSaved(false);

    const requiredLocales = getRequiredLocales();
    const validationErrors: string[] = [];

    chapters.forEach((chapter, index) => {
      if (chapter.images.length === 0) {
        validationErrors.push(`Chương ${index + 1}: cần thêm ít nhất một ảnh.`);
      }
      for (const localeCode of requiredLocales) {
        const localeConfig = LOCALES.find((l) => l.code === localeCode);
        const localeLabel = localeConfig?.label ?? localeCode;
        const t = chapter.translations[localeCode as LocaleCode];
        if (!t.title.trim()) {
          validationErrors.push(`Chương ${index + 1}: cần nhập tiêu đề (${localeLabel}).`);
        }
      }
    });

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const payload = {
      chapters: chapters.map((chapter) => ({
        images: chapter.images,
        translations: LOCALES.filter(
          (locale) => chapter.translations[locale.code].title.trim().length > 0
        ).map((locale) => ({
          locale: locale.code,
          title: chapter.translations[locale.code].title.trim(),
        })),
      })),
    };

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/brand-story", {
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

      {chapters.length === 0 ? (
        <Card className="p-8 text-center text-sm text-on-surface-variant">
          Chưa có chương nào. Nhấn &quot;Thêm chương&quot; để bắt đầu.
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {chapters.map((chapter, index) => {
            const t = chapter.translations[activeLocale];
            const isRequiredLocale = LOCALES.find((l) => l.code === activeLocale)?.required ?? false;
            return (
              <Card key={chapter.key} className="flex flex-col gap-4 p-6">
                <div className="flex items-center justify-between gap-4">
                  <h2 className={sectionTitleClass}>Chương {index + 1}</h2>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className={rowActionButtonClass}
                      aria-label="Di chuyển lên"
                      disabled={index === 0}
                      onClick={() => moveChapter(chapter.key, -1)}
                    >
                      <ChevronDownIcon width={15} height={15} className="rotate-180" />
                    </button>
                    <button
                      type="button"
                      className={rowActionButtonClass}
                      aria-label="Di chuyển xuống"
                      disabled={index === chapters.length - 1}
                      onClick={() => moveChapter(chapter.key, 1)}
                    >
                      <ChevronDownIcon width={15} height={15} />
                    </button>
                    <button
                      type="button"
                      className={rowActionButtonClass}
                      aria-label="Xóa chương"
                      onClick={() => removeChapter(chapter.key)}
                    >
                      <TrashIcon width={15} height={15} />
                    </button>
                  </div>
                </div>

                <Input
                  label={
                    <>
                      Tiêu đề chương {isRequiredLocale ? <span className="font-bold text-error">*</span> : null}
                    </>
                  }
                  id={`title-${chapter.key}`}
                  placeholder="VD: Our Story"
                  value={t.title}
                  onChange={(e) => updateChapterTitle(chapter.key, activeLocale, e.target.value)}
                  required={isRequiredLocale}
                />

                <div className="flex flex-col gap-2">
                  <label className={labelClass}>
                    Ảnh trong chương ({chapter.images.length}/12)
                  </label>
                  {chapter.images.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {chapter.images.map((imageKey, imageIndex) => (
                        <div
                          key={`${chapter.key}-${imageIndex}`}
                          className="relative flex h-24 w-24 shrink-0 flex-col items-center justify-center overflow-hidden rounded border border-[rgba(196,198,210,0.7)] bg-surface-container-high"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element -- served by our own proxy route, arbitrary storage key, next/image optimization not applicable */}
                          <img
                            src={publicMediaUrl(imageKey)}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-0.5 bg-black/60 py-0.5">
                            <button
                              type="button"
                              className="cursor-pointer border-none bg-transparent p-1 text-white disabled:opacity-30"
                              aria-label="Di chuyển ảnh sang trái"
                              disabled={imageIndex === 0}
                              onClick={() => moveImage(chapter.key, imageIndex, -1)}
                            >
                              <ChevronDownIcon width={11} height={11} className="rotate-90" />
                            </button>
                            <button
                              type="button"
                              className="cursor-pointer border-none bg-transparent p-1 text-white"
                              aria-label="Xóa ảnh"
                              onClick={() => removeImage(chapter.key, imageIndex)}
                            >
                              <TrashIcon width={11} height={11} />
                            </button>
                            <button
                              type="button"
                              className="cursor-pointer border-none bg-transparent p-1 text-white disabled:opacity-30"
                              aria-label="Di chuyển ảnh sang phải"
                              disabled={imageIndex === chapter.images.length - 1}
                              onClick={() => moveImage(chapter.key, imageIndex, 1)}
                            >
                              <ChevronDownIcon width={11} height={11} className="-rotate-90" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <ImageUploadField
                    imageKey={undefined}
                    onChange={(key) => key && addImage(chapter.key, key)}
                    namespace="brand-story"
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {canEdit ? (
        <div className="flex flex-wrap items-center gap-4">
          <Button type="button" variant="secondary" onClick={addChapter}>
            <PlusIcon width={14} height={14} />
            Thêm chương
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
