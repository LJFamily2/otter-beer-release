import type { Metadata } from "next";
import { DEFAULT_LOCALE } from "@/config/locales";
import { ADDRESS, CONTACT, LEGAL_NAME } from "@/config/brand";
import { buildStaticPageMetadata } from "@/lib/seo";

interface PrivacyPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PrivacyPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isVi = locale === DEFAULT_LOCALE;

  return buildStaticPageMetadata({
    locale,
    path: "/privacy",
    title: isVi ? "Chính Sách Bảo Mật Dữ Liệu" : "Privacy Policy",
    description: isVi
      ? `Chính sách bảo vệ dữ liệu cá nhân của ${LEGAL_NAME} theo Nghị định 13/2023/NĐ-CP.`
      : `Personal data protection policy of ${LEGAL_NAME} under Decree 13/2023/ND-CP and international standards.`,
  });
}

export default async function PrivacyPolicyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;
  const isVi = locale === DEFAULT_LOCALE;

  return (
    <div className="relative min-h-screen bg-surface text-on-surface antialiased flex flex-col">
      {/* Header Section */}
      <header className="relative w-full pt-28 sm:pt-36 lg:pt-40 pb-16 md:pb-24 bg-surface-container-lowest border-b border-surface-variant overflow-hidden">
        <div className="heritage-pattern absolute inset-0 pointer-events-none" />
        <div className="relative z-10 mx-auto max-w-[1280px] px-6 text-center">
          <h1 className="font-display text-4xl md:text-6xl text-primary uppercase tracking-tight mb-4">
            {isVi ? "Chính Sách Bảo Mật Dữ Liệu" : "Privacy Policy"}
          </h1>
          <p className="text-base md:text-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            {isVi
              ? `Tại Otter Beer (vận hành bởi ${LEGAL_NAME}), chúng tôi cam kết bảo vệ dữ liệu cá nhân của bạn tuân thủ Nghị định 13/2023/NĐ-CP của Chính phủ Việt Nam và các tiêu chuẩn bảo mật quốc tế (GDPR).`
              : `At Otter Beer (operated by ${LEGAL_NAME}), we are committed to protecting your personal data in full compliance with Decree 13/2023/ND-CP of Vietnam and global standards.`}
          </p>
          <p className="text-xs text-on-surface-variant font-mono uppercase tracking-widest mt-6">
            {isVi ? "Cập nhật lần cuối: Tháng 09, 2026" : "Last Updated: September 2026"}
          </p>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-6 py-12 md:py-20 flex flex-col gap-12">
        {/* Section 0: Data Controller Info */}
        <section className="w-full max-w-3xl bg-surface-container-low border border-surface-variant p-6 rounded-sm">
          <h2 className="font-display text-xl md:text-2xl text-primary uppercase mb-3 flex items-center gap-3">
            <span className="text-mahogany">00.</span>{" "}
            {isVi ? "Đơn Vị Kiểm Soát & Xử Lý Dữ Liệu" : "Data Controller Details"}
          </h2>
          <div className="space-y-2 text-sm md:text-base text-on-surface-variant">
            <p>
              <strong className="text-on-surface">{isVi ? "Tên Doanh Nghiệp:" : "Legal Company Name:"}</strong>{" "}
              {isVi ? "CÔNG TY TNHH BADENBEER" : LEGAL_NAME}
            </p>
            <p>
              <strong className="text-on-surface">{isVi ? "Địa chỉ trụ sở:" : "Registered Office Address:"}</strong>{" "}
              {isVi
                ? "Số nhà 13, hẻm 30, đường Lạc Long Quân, phường Hiệp Định, tỉnh Tây Ninh, Việt Nam"
                : `${ADDRESS.streetAddress}, ${ADDRESS.addressLocality}, ${ADDRESS.addressRegion}, ${ADDRESS.addressCountry}`}
            </p>
            <p>
              <strong className="text-on-surface">{isVi ? "Hotline hỗ trợ:" : "Support Hotline:"}</strong>{" "}
              {CONTACT.phonesDisplay.join(" / ")}
            </p>
            <p>
              <strong className="text-on-surface">{isVi ? "Email Bảo Vệ Dữ Liệu (DPO):" : "Data Protection Contact Email:"}</strong>{" "}
              <a href={`mailto:${CONTACT.email}`} className="text-mahogany underline font-medium">
                {CONTACT.email}
              </a>
            </p>
          </div>
        </section>

        {/* Section 1 */}
        <section className="w-full max-w-3xl">
          <h2 className="font-display text-2xl md:text-3xl text-mahogany uppercase mb-4">
            {isVi ? "01. Thu Thập & Phân Loại Dữ Liệu" : "01. Collection & Categories of Data"}
          </h2>
          <div className="space-y-4 text-on-surface-variant leading-relaxed">
            <p>
              {isVi
                ? "Chúng tôi thu thập dữ liệu cá nhân cơ bản và thông tin kỹ thuật phục vụ việc vận hành website và xác minh dịch vụ:"
                : "We collect basic personal data and technical information necessary for providing our website services:"}
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                {isVi
                  ? "Thông tin xác minh độ tuổi (lưu qua cookie otter_age_verified để đảm bảo tuân thủ Luật Phòng chống tác hại của rượu bia)."
                  : "Age verification status (stored via otter_age_verified cookie for legal compliance)."}
              </li>
              <li>
                {isVi
                  ? "Thông tin liên hệ (họ tên, email, số điện thoại) khi bạn gửi yêu cầu liên hệ hoặc hợp tác phân phối."
                  : "Contact details (name, email, phone) provided voluntarily via contact or wholesale forms."}
              </li>
              <li>
                {isVi
                  ? "Dữ liệu kỹ thuật tự động (địa chỉ IP, loại trình duyệt, nhật ký truy cập, tùy chọn cookie)."
                  : "Technical data (IP address, browser type, device logs, cookie preferences)."}
              </li>
            </ul>
          </div>
        </section>

        {/* Section 2 */}
        <section className="w-full max-w-3xl">
          <h2 className="font-display text-2xl md:text-3xl text-mahogany uppercase mb-4">
            {isVi ? "02. Mục Đích & Cách Thức Xử Lý Dữ Liệu" : "02. Purpose & Processing Methods"}
          </h2>
          <div className="space-y-4 text-on-surface-variant leading-relaxed">
            <p>
              {isVi
                ? "Dữ liệu cá nhân thu thập chỉ được xử lý cho các mục đích hợp pháp sau:"
                : "Personal data is processed strictly for the following legitimate purposes:"}
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                {isVi
                  ? "Xác minh độ tuổi hợp pháp trước khi hiển thị nội dung đồ uống có cồn."
                  : "Verifying legal age before displaying alcohol beverage content."}
              </li>
              <li>
                {isVi
                  ? "Phản hồi các yêu cầu báo giá, mua hàng sỉ, tham quan nhà máy hoặc hỗ trợ khách hàng."
                  : "Responding to inquiry requests, wholesale orders, or customer support."}
              </li>
              <li>
                {isVi
                  ? "Phân tích lưu lượng và cải thiện chất lượng dịch vụ (khi bạn đồng ý bật Cookie Phân Tích)."
                  : "Analyzing website performance (only when you opt-in to Analytics Cookies)."}
              </li>
            </ul>
          </div>
        </section>

        {/* Section 3: Data Subject Rights under Decree 13 */}
        <section className="w-full max-w-3xl">
          <h2 className="font-display text-2xl md:text-3xl text-mahogany uppercase mb-4">
            {isVi ? "03. Quyền Của Chủ Thể Dữ Liệu (Nghị định 13/2023/NĐ-CP)" : "03. Data Subject Rights"}
          </h2>
          <div className="space-y-4 text-on-surface-variant leading-relaxed">
            <p>
              {isVi
                ? "Theo Điều 9 Nghị định 13/2023/NĐ-CP và các quy định bảo mật quốc tế, bạn có các quyền hợp pháp sau đối với dữ liệu cá nhân của mình:"
                : "Under Article 9 of Decree 13/2023/ND-CP and international privacy laws, you possess the following rights:"}
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-sm">
              <li className="p-3 bg-surface-container-low border border-surface-variant rounded-xs">
                <strong>{isVi ? "1. Quyền được biết:" : "1. Right to be informed:"}</strong> {isVi ? "Biết về hoạt động xử lý dữ liệu." : "Know about data processing activities."}
              </li>
              <li className="p-3 bg-surface-container-low border border-surface-variant rounded-xs">
                <strong>{isVi ? "2. Quyền đồng ý:" : "2. Right to consent:"}</strong> {isVi ? "Đồng ý hoặc không đồng ý xử lý." : "Give or withhold consent freely."}
              </li>
              <li className="p-3 bg-surface-container-low border border-surface-variant rounded-xs">
                <strong>{isVi ? "3. Quyền truy cập:" : "3. Right of access:"}</strong> {isVi ? "Xem, chỉnh sửa dữ liệu của mình." : "Access or rectify personal data."}
              </li>
              <li className="p-3 bg-surface-container-low border border-surface-variant rounded-xs">
                <strong>{isVi ? "4. Quyền rút lại sự đồng ý:" : "4. Right to withdraw consent:"}</strong> {isVi ? "Rút lại sự đồng ý bất kỳ lúc nào." : "Withdraw consent at any time."}
              </li>
              <li className="p-3 bg-surface-container-low border border-surface-variant rounded-xs">
                <strong>{isVi ? "5. Quyền xóa dữ liệu:" : "5. Right to erasure:"}</strong> {isVi ? "Yêu cầu xóa dữ liệu cá nhân." : "Request deletion of data."}
              </li>
              <li className="p-3 bg-surface-container-low border border-surface-variant rounded-xs">
                <strong>{isVi ? "6. Quyền hạn chế & phản đối:" : "6. Right to restrict/object:"}</strong> {isVi ? "Hạn chế hoặc phản đối xử lý." : "Restrict or object to processing."}
              </li>
            </ul>
          </div>
        </section>

        {/* Section 4: Cross-border Transfer */}
        <section className="w-full max-w-3xl">
          <h2 className="font-display text-2xl md:text-3xl text-mahogany uppercase mb-4">
            {isVi ? "04. Chuyển Dữ Liệu Ra Nước Ngoài" : "04. Cross-Border Data Transfer"}
          </h2>
          <div className="space-y-4 text-on-surface-variant leading-relaxed">
            <p>
              {isVi
                ? "Website sử dụng một số hạ tầng dịch vụ điện toán đám mây và phân tích quốc tế (như Google Analytics). Việc truyền tải dữ liệu kỹ thuật được bảo vệ bằng các cơ chế mã hóa SSL/TLS an toàn và tuân thủ các quy định về chuyển dữ liệu ra nước ngoài theo quy định pháp luật."
                : "Our website uses secure cloud infrastructure and international web analytics tools (e.g. Google Analytics). Technical data transmission is secured via standard SSL/TLS encryption in compliance with applicable cross-border data transfer regulations."}
            </p>
          </div>
        </section>

        {/* Section 5: Exercise Rights */}
        <section className="w-full max-w-3xl">
          <h2 className="font-display text-2xl md:text-3xl text-mahogany uppercase mb-4">
            {isVi ? "05. Gửi Yêu Cầu Bảo Vệ Dữ Liệu" : "05. Exercising Your Rights"}
          </h2>
          <div className="space-y-4 text-on-surface-variant leading-relaxed">
            <p>
              {isVi
                ? "Để thực hiện bất kỳ quyền nào nêu trên hoặc gửi thắc mắc liên quan đến bảo mật thông tin, vui lòng liên hệ trực tiếp Bộ phận Bảo vệ Dữ liệu của chúng tôi:"
                : "To exercise any of your rights or raise privacy concerns, please contact our Data Protection Officer directly:"}
            </p>
            <p className="p-4 bg-surface-container border border-surface-variant rounded-sm">
              <strong className="text-on-surface block mb-1">
                {isVi ? "CÔNG TY TNHH BADENBEER - Bộ Phận Bảo Vệ Dữ Liệu" : "BADENBEER Co., Ltd. - Data Protection Office"}
              </strong>
              Email:{" "}
              <a
                href={`mailto:${CONTACT.email}`}
                className="text-mahogany font-medium hover:text-secondary underline underline-offset-4"
              >
                {CONTACT.email}
              </a>{" "}
              | Hotline: {CONTACT.phonesDisplay[0]}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

