import type { Metadata } from "next";
import { ProductShowcase } from "@/components/sections/ProductShowcase";
import { beerService } from "@/services/BeerService";
import { toShowcaseItem } from "@/lib/utils/BeerPresenter";
import { buildStaticPageMetadata } from "@/lib/seo";

interface MenuPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: MenuPageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildStaticPageMetadata({
    locale,
    path: "/menu",
    title: locale === "vi" ? "Thực Đơn Bia" : "Our Beers",
    description:
      locale === "vi"
        ? "Khám phá các dòng bia thủ công của Otter Beer."
        : "Explore the craft beers brewed by Otter Beer.",
  });
}

export default async function MenuPage({ params }: MenuPageProps) {
  const { locale } = await params;

  const beers = await beerService
    .listShowcasePublished()
    .then((items) =>
      items
        .map((beer) => toShowcaseItem(beer, locale))
        .filter((item) => item !== null)
    )
    .catch(() => []);

  return (
    <div className="min-h-screen bg-background">
      {beers.length > 0 ? (
        <ProductShowcase locale={locale} beers={beers} />
      ) : (
        <div className="flex h-[50vh] items-center justify-center text-on-surface-variant pt-32 sm:pt-40">
          {locale === "vi" ? "Đang cập nhật thực đơn..." : "Menu coming soon..."}
        </div>
      )}
    </div>
  );
}
