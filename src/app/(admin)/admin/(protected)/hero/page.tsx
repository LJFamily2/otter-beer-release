import type { Metadata } from "next";
import { auth } from "@/auth";
import { heroSectionService } from "@/services/HeroSectionService";
import { MODULE_KEYS } from "@/config/permissions";
import { LOCALES, type LocaleCode } from "@/config/locales";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { HeroSlidesForm, type HeroSlideFormState } from "./HeroSlidesForm";

export const metadata: Metadata = {
  title: "Ảnh bìa trang chủ",
  robots: { index: false, follow: false },
};

export default async function HeroSectionPage() {
  const session = await auth();
  const grant = session?.user?.permissions?.[MODULE_KEYS.HERO_SECTION];

  if (!grant?.view) {
    return (
      <div className="p-16 text-center text-on-surface-variant">
        Bạn không có quyền xem nội dung này.
      </div>
    );
  }

  const heroSection = await heroSectionService.get();

  const initialSlides: HeroSlideFormState[] = (heroSection?.slides ?? []).map(
    (slide, index) => {
      const translations = {} as Record<LocaleCode, { alt: string }>;
      for (const locale of LOCALES) {
        const match = slide.translations.find((t) => t.locale === locale.code);
        translations[locale.code] = { alt: match?.alt ?? "" };
      }
      return {
        key: `existing-${index}`,
        mediaKey: slide.mediaKey,
        mobileMediaKey: slide.mobileMediaKey,
        mediaType: slide.mediaType,
        status: slide.status,
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
            { label: "Ảnh bìa trang chủ" },
          ]}
        />
        <h1 className="text-[32px] tracking-wide text-primary">Ảnh bìa trang chủ</h1>
        <p className="text-base text-on-surface-variant">
          Quản lý các slide của băng ảnh bìa đầu trang chủ — mỗi slide gồm một ảnh
          hoặc video tỉ lệ 16:9 và mô tả ảnh (alt) theo ngôn ngữ.
        </p>
      </div>

      <HeroSlidesForm initialSlides={initialSlides} canEdit={Boolean(grant.edit)} />
    </div>
  );
}
