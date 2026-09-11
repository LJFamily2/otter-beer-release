import type { Metadata } from "next";
import { AgeVerificationGate } from "@/components/ui/AgeVerificationGate";
import { buildStaticPageMetadata } from "@/lib/seo";

interface AgeVerificationPageProps {
  params: Promise<{ locale: string }>;
}

// noindex: an interstitial gate has no business ranking for anything, and a
// gate page surfacing in results is a classic way for the real page to lose
// its own snippet. robots.ts disallows it too; this is the on-page half.
export async function generateMetadata({
  params,
}: AgeVerificationPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isVi = locale === "vi";

  return buildStaticPageMetadata({
    locale,
    path: "/age-verification",
    title: isVi ? "Xác Minh Độ Tuổi" : "Age Verification",
    description: isVi
      ? "Vui lòng xác nhận bạn đã đủ 18 tuổi để vào website Otter Beer."
      : "Please verify that you are 18 years of age or older to enter Otter Beer.",
    noIndex: true,
  });
}

export default async function AgeVerificationPage({
  params,
}: AgeVerificationPageProps) {
  const { locale } = await params;

  return <AgeVerificationGate locale={locale} isStandalone={true} />;
}
