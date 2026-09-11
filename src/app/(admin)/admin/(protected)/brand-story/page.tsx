import type { Metadata } from "next";
import { auth } from "@/auth";
import { brandStoryService } from "@/services/BrandStoryService";
import { MODULE_KEYS } from "@/config/permissions";
import { LOCALES, type LocaleCode } from "@/config/locales";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { BrandStoryForm, type BrandStoryChapterFormState } from "./BrandStoryForm";

export const metadata: Metadata = {
  title: "Câu chuyện thương hiệu",
  robots: { index: false, follow: false },
};

export default async function BrandStoryPage() {
  const session = await auth();
  const grant = session?.user?.permissions?.[MODULE_KEYS.BRAND_STORY];

  if (!grant?.view) {
    return (
      <div className="p-16 text-center text-on-surface-variant">
        Bạn không có quyền xem nội dung này.
      </div>
    );
  }

  const brandStory = await brandStoryService.get();

  const initialChapters: BrandStoryChapterFormState[] = (brandStory?.chapters ?? []).map(
    (chapter, index) => {
      const translations = {} as Record<LocaleCode, { title: string }>;
      for (const locale of LOCALES) {
        const match = chapter.translations.find((t) => t.locale === locale.code);
        translations[locale.code] = { title: match?.title ?? "" };
      }
      return {
        key: `existing-${index}`,
        images: chapter.images,
        translations,
      };
    }
  );

  return (
    <div className="flex max-w-[860px] flex-col gap-8 pb-12">
      <div className="flex flex-col gap-3 border-b border-[rgba(196,198,210,0.3)] pb-4">
        <Breadcrumbs
          items={[
            { label: "Quản trị", href: "/admin" },
            { label: "Câu chuyện thương hiệu" },
          ]}
        />
        <h1 className="text-[32px] tracking-wide text-primary">Câu chuyện thương hiệu</h1>
        <p className="text-base text-on-surface-variant">
          Quản lý các chương của cuốn sách lật hiển thị trên trang chủ — mỗi chương gồm một
          tiêu đề theo ngôn ngữ và một nhóm ảnh minh họa.
        </p>
      </div>

      <BrandStoryForm initialChapters={initialChapters} canEdit={Boolean(grant.edit)} />
    </div>
  );
}
