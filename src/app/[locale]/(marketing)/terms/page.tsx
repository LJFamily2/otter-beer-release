import type { Metadata } from "next";
import Link from "next/link";
import { DEFAULT_LOCALE } from "@/config/locales";
import { ADDRESS, CONTACT, LEGAL_NAME } from "@/config/brand";
import { buildStaticPageMetadata } from "@/lib/seo";

interface TermsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: TermsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isVi = locale === DEFAULT_LOCALE;

  return buildStaticPageMetadata({
    locale,
    path: "/terms",
    title: isVi ? "Điều Khoản Sử Dụng" : "Terms of Service",
    description: isVi
      ? `Điều khoản sử dụng và hướng dẫn pháp lý khi truy cập website Otter Beer thuộc ${LEGAL_NAME}.`
      : `The Terms of Service and legal guidelines for accessing and using the Otter Beer website operated by ${LEGAL_NAME}.`,
  });
}

export default async function TermsOfServicePage({ params }: TermsPageProps) {
  const { locale } = await params;
  const isVi = locale === DEFAULT_LOCALE;
  const prefix = isVi ? "" : `/${locale}`;

  return (
    <div className="relative min-h-screen bg-surface text-on-surface antialiased flex flex-col">
      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-6 pt-28 sm:pt-36 lg:pt-40 pb-12 md:pb-20">
        <header className="mb-10 border-b border-surface-variant pb-6">
          <h1 className="font-display text-4xl md:text-6xl text-primary uppercase tracking-tight">
            {isVi ? "Điều Khoản Dịch Vụ" : "Terms of Service"}
          </h1>
          <p className="text-sm md:text-base text-on-surface-variant mt-2 font-mono">
            {isVi ? "Cập nhật lần cuối: Tháng 09, 2026" : "Last Updated: September 2026"}
          </p>
        </header>

        <article className="space-y-10 max-w-3xl text-on-surface leading-relaxed">
          {/* Section 01: Entity Details */}
          <section className="bg-surface-container-low border border-surface-variant p-6 rounded-sm">
            <h2 className="font-display text-xl md:text-2xl text-primary uppercase mb-3 flex items-center gap-3">
              <span className="text-mahogany">01.</span>{" "}
              {isVi ? "Đơn Vị Chủ Quản & Thông Tin Pháp Lý" : "Operating Entity & Legal Info"}
            </h2>
            <div className="space-y-2 text-sm md:text-base text-on-surface-variant">
              <p>
                <strong className="text-on-surface">{isVi ? "Tên Doanh Nghiệp:" : "Legal Company Name:"}</strong>{" "}
                {isVi ? "CÔNG TY TNHH BADENBEER" : LEGAL_NAME}
              </p>
              <p>
                <strong className="text-on-surface">{isVi ? "Thương hiệu:" : "Brand:"}</strong> Otter Beer
              </p>
              <p>
                <strong className="text-on-surface">{isVi ? "Địa chỉ trụ sở / Xưởng sản xuất:" : "Registered Address / Brewery:"}</strong>{" "}
                {isVi
                  ? "Số nhà 13, hẻm 30, đường Lạc Long Quân, phường Hiệp Định, tỉnh Tây Ninh, Việt Nam"
                  : `${ADDRESS.streetAddress}, ${ADDRESS.addressLocality}, ${ADDRESS.addressRegion}, ${ADDRESS.addressCountry}`}
              </p>
              <p>
                <strong className="text-on-surface">{isVi ? "Số điện thoại liên hệ:" : "Contact Phone:"}</strong>{" "}
                {CONTACT.phonesDisplay.join(" / ")}
              </p>
              <p>
                <strong className="text-on-surface">{isVi ? "Email hỗ trợ / Pháp lý:" : "Legal / Support Email:"}</strong>{" "}
                <a href={`mailto:${CONTACT.email}`} className="text-mahogany underline">
                  {CONTACT.email}
                </a>
              </p>
            </div>
          </section>

          {/* Section 02: Acceptance of Terms */}
          <section>
            <h2 className="font-display text-2xl md:text-3xl text-primary mb-3 flex items-center gap-3">
              <span className="text-mahogany">02.</span>{" "}
              {isVi ? "Điều Khoản Sử Dụng" : "Terms of Use"}
            </h2>
            <p className="mb-3 text-on-surface-variant">
              {isVi
                ? `Chào mừng bạn đến với OTTER BEER (vận hành bởi ${LEGAL_NAME}). Bằng cách truy cập hoặc sử dụng trang web của chúng tôi, bạn đồng ý tuân thủ các Điều Khoản Dịch Vụ này. Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản này, vui lòng ngừng truy cập dịch vụ.`
                : `Welcome to OTTER BEER (operated by ${LEGAL_NAME}). By accessing or using our website, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not access our services.`}
            </p>
            <p className="text-on-surface-variant">
              {isVi
                ? "Chúng tôi có quyền sửa đổi hoặc thay thế các Điều khoản này bất kỳ lúc nào để phù hợp với quy định pháp luật hiện hành. Việc bạn tiếp tục sử dụng website đồng nghĩa với việc chấp nhận các thay đổi đó."
                : "We reserve the right to modify or replace these Terms at any time to align with legal requirements. Your continued use of the site constitutes acceptance of those updates."}
            </p>
          </section>

          {/* Section 03: Age Verification & Alcohol Policy */}
          <section>
            <h2 className="font-display text-2xl md:text-3xl text-primary mb-3 flex items-center gap-3">
              <span className="text-mahogany">03.</span>{" "}
              {isVi ? "Quy Định Độ Tuổi & Cảnh Báo Sức Khỏe (18+)" : "Age Verification & Alcohol Policy (18+ / 21+)"}
            </h2>
            <p className="mb-3 text-on-surface-variant">
              {isVi
                ? "Theo Luật Phòng, chống tác hại của rượu, bia số 44/2019/QH14 của Quốc hội Việt Nam, việc truy cập và mua các sản phẩm đồ uống có cồn nghiêm cấm đối với người chưa đủ 18 tuổi. Tại các quốc gia khác (như Hoa Kỳ), độ tuổi tối thiểu theo quy định là 21 tuổi."
                : "Access to this website is restricted to individuals of legal drinking age in their jurisdiction (18+ in Vietnam under Law No. 44/2019/QH14, 21+ in the United States)."}
            </p>
            <div className="p-4 bg-amber-500/10 border-l-4 border-amber-500 text-sm text-on-surface-variant space-y-1">
              <p className="font-semibold text-primary uppercase">
                {isVi ? "Cảnh báo pháp lý theo Luật Việt Nam:" : "Statutory Health Warning (Vietnam Law):"}
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>{isVi ? "Người dưới 18 tuổi không được uống rượu, bia." : "Individuals under 18 years of age are not permitted to consume alcohol."}</li>
                <li>{isVi ? "Uống rượu, bia có thể gây tai nạn giao thông." : "Drinking alcohol can cause traffic accidents."}</li>
                <li>{isVi ? "Phụ nữ mang thai không nên uống rượu, bia." : "Pregnant women should not consume alcohol."}</li>
              </ul>
            </div>
          </section>

          {/* Section 04: Intellectual Property */}
          <section>
            <h2 className="font-display text-2xl md:text-3xl text-primary mb-3 flex items-center gap-3">
              <span className="text-mahogany">04.</span>{" "}
              {isVi ? "Sở Hữu Trí Tuệ" : "Intellectual Property"}
            </h2>
            <p className="mb-3 text-on-surface-variant">
              {isVi
                ? `Tất cả nội dung, nhãn hiệu, logo, thiết kế và hình ảnh trên website này thuộc sở hữu độc quyền của ${LEGAL_NAME} hoặc được cấp phép hợp pháp.`
                : `All original content, trademarks, logos, and features are the exclusive property of ${LEGAL_NAME} and its licensors.`}
            </p>
            <p className="text-on-surface-variant">
              {isVi
                ? "Nghiêm cấm sao chép, phân phối hoặc sử dụng thương hiệu Otter Beer cho bất kỳ mục đích thương mại nào mà không có sự đồng ý bằng văn bản."
                : "Reproduction or unauthorized commercial use of Otter Beer trademarks without prior written consent is strictly prohibited."}
            </p>
          </section>

          {/* Section 05: Limitation of Liability */}
          <section>
            <h2 className="font-display text-2xl md:text-3xl text-primary mb-3 flex items-center gap-3">
              <span className="text-mahogany">05.</span>{" "}
              {isVi ? "Giới Hạn Trách Nhiệm" : "Limitation of Liability"}
            </h2>
            <p className="text-on-surface-variant">
              {isVi
                ? `Trong mọi trường hợp, ${LEGAL_NAME} hoặc các giám đốc, nhân viên, đối tác của công ty sẽ không chịu trách nhiệm đối với bất kỳ thiệt hại gián tiếp, ngẫu nhiên hoặc phát sinh nào từ việc truy cập hoặc sử dụng Dịch vụ không đúng mục đích.`
                : `In no event shall ${LEGAL_NAME}, nor its directors, employees, or partners, be liable for any indirect, incidental, or consequential damages resulting from misuse of the site.`}
            </p>
          </section>

          {/* Section 06: Governing Law & Jurisdiction */}
          <section>
            <h2 className="font-display text-2xl md:text-3xl text-primary mb-3 flex items-center gap-3">
              <span className="text-mahogany">06.</span>{" "}
              {isVi ? "Luật Áp Dụng & Giải Quyết Tranh Chấp" : "Governing Law & Jurisdiction"}
            </h2>
            <p className="text-on-surface-variant">
              {isVi
                ? "Các Điều Khoản Dịch Vụ này được điều chỉnh và giải thích theo pháp luật nước Cộng hòa Xã hội Chủ nghĩa Việt Nam. Mọi tranh chấp phát sinh sẽ được giải quyết trước hết thông qua thương lượng; nếu không thể thỏa thuận, tranh chấp sẽ thuộc thẩm quyền giải quyết của Tòa án nhân dân có thẩm quyền tại Việt Nam."
                : "These Terms shall be governed by and construed in accordance with the laws of the Socialist Republic of Vietnam. Any disputes arising hereunder shall be subject to the exclusive jurisdiction of the competent courts in Vietnam."}
            </p>
          </section>

          {/* Action Button */}
          <div className="pt-6">
            <Link
              href={`${prefix}/`}
              className="inline-block bg-mahogany hover:bg-primary text-on-primary font-bold text-xs uppercase tracking-wider py-3 px-8 rounded-sm transition-colors duration-300"
            >
              {isVi ? "Xác Nhận & Tiếp Tục" : "Acknowledge & Continue"}
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}

