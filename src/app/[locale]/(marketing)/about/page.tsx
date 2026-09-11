import type { Metadata } from "next";
import { BrandStorySection } from "@/components/sections/BrandStorySection";
import { brandStoryService } from "@/services/BrandStoryService";
import { toBookChapters } from "@/lib/utils/BrandStoryPresenter";
import { buildStaticPageMetadata } from "@/lib/seo";

interface AboutPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: AboutPageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildStaticPageMetadata({
    locale,
    path: "/about",
    title: locale === "vi" ? "Câu Chuyện Của Chúng Tôi" : "Our Story",
    description:
      locale === "vi"
        ? "Lịch sử và niềm đam mê đằng sau mỗi giọt bia Otter Beer."
        : "The history and passion behind every drop of Otter Beer.",
  });
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;

  const brandStoryChapters = await brandStoryService
    .getPublished()
    .then((brandStory) => toBookChapters(brandStory, locale))
    .catch(() => []);

  return (
    <div className="min-h-screen bg-[#0e0c0b]">
      {brandStoryChapters.length > 0 ? (
        <BrandStorySection locale={locale} chapters={brandStoryChapters} />
      ) : (
        <div className="flex h-[50vh] items-center justify-center text-[#fdf9f4]/50 pt-[72px] sm:pt-[88px]">
          {locale === "vi"
            ? "Đang cập nhật câu chuyện..."
            : "Story coming soon..."}
        </div>
      )}
    </div>
  );
}
