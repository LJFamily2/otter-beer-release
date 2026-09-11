import type { Metadata } from "next";
import ContactSection from "./Contact";
import {
  buildBreadcrumbJsonLd,
  buildBreweryJsonLd,
  buildOrganizationJsonLd,
  buildStaticPageMetadata,
  jsonLdGraph,
  toBreadcrumbItems,
  type BreadcrumbEntry,
} from "@/lib/seo";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ADDRESS, CONTACT } from "@/config/brand";

interface ContactPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: ContactPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isVi = locale === "vi";

  return buildStaticPageMetadata({
    locale,
    path: "/contact",
    // The hardcoded "| Otter Beer" suffix is gone, and the brand is left out
    // of the title itself: the root layout's template appends it, so either
    // one would render the brand twice and eat the ~60 characters Google shows.
    title: isVi ? "Liên Hệ" : "Contact",
    description: isVi
      ? `Liên hệ nhà máy bia thủ công Otter Beer tại ${ADDRESS.addressRegion}: đặt bia cho sự kiện, phân phối sỉ, tham quan nhà máy. Gọi ${CONTACT.phonesDisplay[0]} hoặc email ${CONTACT.email}.`
      : `Contact the Otter Beer craft brewery in ${ADDRESS.addressRegion} about private events, wholesale distribution and brewery visits. Call ${CONTACT.phonesDisplay[0]} or email ${CONTACT.email}.`,
    imagePath: "/images/contact-hero.jpg",
  });
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params;
  const isVi = locale === "vi";

  /**
   * The contact page is where "where is Otter Beer / how do I reach them"
   * gets answered, so it carries the Brewery node (full NAP, hours, geo)
   * plus a breadcrumb trail back to the homepage.
   */
  const trail: BreadcrumbEntry[] = [
    { name: isVi ? "Trang chủ" : "Home", path: "/" },
    { name: isVi ? "Liên hệ" : "Contact", path: "/contact" },
  ];

  const jsonLd = jsonLdGraph([
    buildOrganizationJsonLd(),
    buildBreweryJsonLd(locale),
    buildBreadcrumbJsonLd(locale, trail),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="bg-[#0d0f10] pt-24 sm:pt-32 lg:pt-36">
        <Breadcrumbs
          items={toBreadcrumbItems(locale, trail)}
          className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-16"
        />
      </div>
      <ContactSection locale={locale} />
    </>
  );
}
