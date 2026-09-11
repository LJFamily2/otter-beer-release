"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LOCALES, getRequiredLocales, type LocaleCode } from "@/config/locales";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

interface TranslationFormState {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  ogImageKey?: string;
}

function emptyTranslation(): TranslationFormState {
  return {
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
    ogImageKey: undefined,
  };
}

export interface PostFormInitialData {
  coverImageKey?: string;
  tags: string[];
  status: "draft" | "published";
  translations: Partial<Record<LocaleCode, TranslationFormState>>;
}

interface PostFormProps {
  mode: "create" | "edit";
  postId?: string;
  initialData?: PostFormInitialData;
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

export function PostForm({ mode, postId, initialData }: PostFormProps) {
  const router = useRouter();
  const [activeLocale, setActiveLocale] = useState<LocaleCode>(
    LOCALES[0].code
  );
  const [coverImageKey, setCoverImageKey] = useState(
    initialData?.coverImageKey
  );
  const [tagsInput, setTagsInput] = useState(
    initialData?.tags.join(", ") ?? ""
  );
  const [status, setStatus] = useState<"draft" | "published">(
    initialData?.status ?? "draft"
  );
  const [translations, setTranslations] = useState<
    Record<LocaleCode, TranslationFormState>
  >(() => {
    const initial = {} as Record<LocaleCode, TranslationFormState>;
    for (const locale of LOCALES) {
      initial[locale.code] =
        initialData?.translations[locale.code] ?? emptyTranslation();
    }
    return initial;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function updateTranslation(
    locale: LocaleCode,
    patch: Partial<TranslationFormState>
  ) {
    // Clear field errors as user types
    const patchKeys = Object.keys(patch);
    setFieldErrors((prev) => {
      const next = { ...prev };
      for (const k of patchKeys) {
        delete next[k];
      }
      return next;
    });

    setTranslations((prev) => ({
      ...prev,
      [locale]: { ...prev[locale], ...patch },
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrors([]);
    setFieldErrors({});

    const requiredLocales = getRequiredLocales();
    const validationErrors: string[] = [];
    const newFieldErrors: Record<string, string> = {};

    for (const localeCode of requiredLocales) {
      const localeConfig = LOCALES.find((l) => l.code === localeCode);
      const localeLabel = localeConfig?.label ?? localeCode;
      const t = translations[localeCode as LocaleCode];

      if (!t.title.trim()) {
        validationErrors.push(`Cần nhập tiêu đề bài viết (${localeLabel}).`);
        if (localeCode === activeLocale) {
          newFieldErrors.title = "Cần nhập tiêu đề bài viết";
        }
      }
      if (!t.excerpt.trim()) {
        validationErrors.push(`Cần nhập mô tả ngắn (${localeLabel}).`);
        if (localeCode === activeLocale) {
          newFieldErrors.excerpt = "Cần nhập mô tả ngắn bài viết";
        }
      }
      const plainTextContent = t.content.replace(/<[^>]*>/g, "").trim();
      if (!plainTextContent && !t.content.includes("<img")) {
        validationErrors.push(`Cần nhập nội dung bài viết (${localeLabel}).`);
        if (localeCode === activeLocale) {
          newFieldErrors.content = "Cần nhập nội dung bài viết";
        }
      }
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setFieldErrors(newFieldErrors);
      setActiveLocale(requiredLocales[0] as LocaleCode);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const activeTranslations = LOCALES.filter(
      (locale) => translations[locale.code].title.trim().length > 0
    ).map((locale) => {
      const t = translations[locale.code];
      return {
        locale: locale.code,
        title: t.title.trim(),
        slug: t.slug.trim() || undefined,
        excerpt: t.excerpt.trim(),
        content: t.content,
        seoTitle: t.seoTitle.trim() || undefined,
        seoDescription: t.seoDescription.trim() || undefined,
        seoKeywords: t.seoKeywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
        ogImageKey: t.ogImageKey,
      };
    });

    const payload = {
      coverImageKey,
      tags: tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      status,
      translations: activeTranslations,
    };

    setIsSubmitting(true);
    try {
      const response = await fetch(
        mode === "create" ? "/api/news-blog" : `/api/news-blog/${postId}`,
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
          if (typeof body.error === "string" && !body.error.includes("Validation failed")) {
            serverErrors.push(body.error);
          } else {
            serverErrors.push("Dữ liệu không hợp lệ. Vui lòng điền đầy đủ các thông tin bắt buộc.");
          }
          if (body.details.formErrors?.length) {
            serverErrors.push(...body.details.formErrors);
          }
          if (body.details.fieldErrors) {
            for (const [, errs] of Object.entries(body.details.fieldErrors)) {
              if (Array.isArray(errs)) {
                serverErrors.push(...(errs as string[]));
              }
            }
          }
          setErrors(serverErrors);
        } else {
          setErrors([body?.error ?? "Không thể lưu bài viết. Vui lòng thử lại."]);
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      router.push("/admin/blog");
      router.refresh();
    } catch (err) {
      setErrors([err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định."]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  }

  const active = translations[activeLocale];
  const isRequiredLocale = LOCALES.find((l) => l.code === activeLocale)?.required ?? false;
  const pageTitle = mode === "create" ? "Tạo bài viết mới" : "Chỉnh sửa bài viết";

  return (
    <form
      className="flex max-w-[860px] flex-col gap-8 pb-12"
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-3 border-b border-[rgba(196,198,210,0.3)] pb-4">
        <Breadcrumbs
          items={[
            { label: "Quản trị", href: "/admin" },
            { label: "Tin tức & Blog", href: "/admin/blog" },
            { label: mode === "create" ? "Tạo bài viết" : "Chỉnh sửa bài viết" },
          ]}
        />
        <h1 className="text-[32px] tracking-wide text-primary">{pageTitle}</h1>
      </div>

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
              Tiêu đề {isRequiredLocale ? <span className="text-error font-bold">*</span> : null}
            </>
          }
          id="title"
          placeholder="Nhập tiêu đề bài viết..."
          value={active.title}
          error={fieldErrors.title}
          onChange={(e) =>
            updateTranslation(activeLocale, { title: e.target.value })
          }
          required={isRequiredLocale}
        />

        <Input
          label="Đường dẫn (để trống để tự tạo)"
          id="slug"
          value={active.slug}
          placeholder="vi-du-duong-dan-bai-viet"
          onChange={(e) =>
            updateTranslation(activeLocale, { slug: e.target.value })
          }
        />

        <Textarea
          label={
            <>
              Mô tả ngắn {isRequiredLocale ? <span className="text-error font-bold">*</span> : null}
            </>
          }
          id="excerpt"
          placeholder="Nhập tóm tắt bài viết..."
          maxLength={300}
          value={active.excerpt}
          error={fieldErrors.excerpt}
          onChange={(e) =>
            updateTranslation(activeLocale, { excerpt: e.target.value })
          }
          hint={`${active.excerpt.length}/300`}
        />

        <div className={fieldClass}>
          <label className={labelClass}>
            Nội dung {isRequiredLocale ? <span className="text-error font-bold">*</span> : null}
          </label>
          <RichTextEditor
            value={active.content}
            error={fieldErrors.content}
            onChange={(html) =>
              updateTranslation(activeLocale, { content: html })
            }
            placeholder="Viết nội dung bài viết..."
          />
        </div>
      </Card>

      <Card className={sectionClass}>
        <h2 className={sectionTitleClass}>
          SEO ({LOCALES.find((l) => l.code === activeLocale)?.label})
        </h2>
        <Input
          label="Tiêu đề SEO"
          id="seoTitle"
          placeholder="Tiêu đề hiển thị trên kết quả tìm kiếm..."
          maxLength={70}
          value={active.seoTitle}
          onChange={(e) =>
            updateTranslation(activeLocale, { seoTitle: e.target.value })
          }
        />
        <Textarea
          label="Mô tả SEO"
          id="seoDescription"
          placeholder="Mô tả tóm tắt hiển thị trên kết quả tìm kiếm..."
          maxLength={160}
          value={active.seoDescription}
          onChange={(e) =>
            updateTranslation(activeLocale, {
              seoDescription: e.target.value,
            })
          }
        />
        <Input
          label="Từ khóa (phân cách bằng dấu phẩy)"
          id="seoKeywords"
          placeholder="bột bia, tin tức, sự kiện"
          value={active.seoKeywords}
          onChange={(e) =>
            updateTranslation(activeLocale, {
              seoKeywords: e.target.value,
            })
          }
        />
      </Card>

      <Card className={sectionClass}>
        <h2 className={sectionTitleClass}>Ảnh & Thẻ</h2>
        <div className={fieldClass}>
          <label className={labelClass}>Ảnh bìa</label>
          <ImageUploadField
            imageKey={coverImageKey}
            onChange={setCoverImageKey}
          />
        </div>
        <Input
          label="Thẻ (phân cách bằng dấu phẩy)"
          id="tags"
          value={tagsInput}
          placeholder="brewing, ipa, taproom"
          onChange={(e) => setTagsInput(e.target.value)}
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
          <Button type="button" variant="secondary" onClick={() => router.push("/admin/blog")}>
            Hủy
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Đang lưu..." : "Lưu bài viết"}
          </Button>
        </div>
      </div>
    </form>
  );
}
