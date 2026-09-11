import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Avatar, AvatarGroup } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge, StatusDot } from "@/components/ui/StatusBadge";
import { Accordion } from "@/components/ui/Accordion";
import { ActivityList } from "@/components/ui/ActivityList";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Tabs } from "@/components/ui/Tabs";
import { Pagination } from "@/components/ui/Pagination";
import { NavSidebar } from "@/components/ui/NavSidebar";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { Alert } from "@/components/ui/Alert";
import { Toast } from "@/components/ui/Toast";
import { Tooltip } from "@/components/ui/Tooltip";
import { Spinner } from "@/components/ui/Spinner";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import {
  SearchIcon,
  CartIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  BoxIcon,
  UserIcon,
  BarChartIcon,
  SettingsIcon,
  LogoutIcon,
  ClipboardIcon,
} from "@/components/ui/icons";
import { ModalDemo } from "./ModalDemo";

interface DesignSystemPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: DesignSystemPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isVi = locale === "vi";
  return {
    title: isVi ? "Hệ thống thiết kế" : "Design System",
    description: isVi
      ? "Thư viện thành phần giao diện Coastal Premium dùng trong toàn bộ website Otter Beer."
      : "The Coastal Premium component library used across the Otter Beer website.",
    // Internal component gallery — useful to the team, noise in search results.
    robots: { index: false, follow: false },
  };
}

interface BeerRow {
  name: string;
  style: string;
  abv: string;
  stock: "success" | "warning" | "error";
  stockLabel: string;
}

const BEER_ROWS: BeerRow[] = [
  { name: "Harbor Pale Ale", style: "PALE ALE", abv: "5.2%", stock: "success", stockLabel: "Abundant" },
  { name: "Wharfside Pilsner", style: "PILSNER", abv: "4.8%", stock: "warning", stockLabel: "Low Stock" },
  { name: "Abyss Stout", style: "STOUT", abv: "9.1%", stock: "error", stockLabel: "Depleted" },
];

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-outline-variant/30 pb-4">
      {eyebrow ? (
        <span className="text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">{eyebrow}</span>
      ) : null}
      <h2 className="font-display text-3xl uppercase tracking-wide text-primary">{title}</h2>
      {description ? <p className="max-w-2xl text-on-surface-variant">{description}</p> : null}
    </div>
  );
}

function Preview({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-outline-variant/30 bg-surface-container-low p-8 ${className}`}>
      {children}
    </div>
  );
}

export default async function DesignSystemPage({ params }: DesignSystemPageProps) {
  const { locale } = await params;
  const isVi = locale === "vi";

  const beerColumns: DataTableColumn<BeerRow>[] = [
    { key: "name", header: isVi ? "Tên bia" : "Beer Name", render: (row) => <span className="font-medium text-primary">{row.name}</span> },
    { key: "style", header: isVi ? "Phong cách" : "Style", render: (row) => <Badge variant="outline">{row.style}</Badge> },
    { key: "abv", header: "ABV", render: (row) => row.abv },
    {
      key: "stock",
      header: isVi ? "Tồn kho" : "Stock Status",
      render: (row) => (
        <span className="inline-flex items-center gap-2">
          <StatusDot color={row.stock} />
          {row.stockLabel}
        </span>
      ),
    },
    {
      key: "action",
      header: isVi ? "Thao tác" : "Action",
      align: "right",
      render: () => <span className="text-sm font-bold uppercase text-primary">{isVi ? "Sửa" : "Edit"}</span>,
    },
  ];

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-24 px-5 py-16">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">
          {isVi ? "TÀI LIỆU HỆ THỐNG THIẾT KẾ" : "DESIGN SYSTEM DOCUMENTATION"}
        </span>
        <h1 className="font-display text-[clamp(40px,7vw,64px)] uppercase leading-tight tracking-wide text-primary">
          Coastal Premium
          <br />
          <span className="text-secondary">{isVi ? "Thư viện thành phần" : "Component Library"}</span>
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-on-surface-variant">
          {isVi
            ? "Mọi thành phần giao diện dùng trong website Otter Beer, tuỳ chỉnh qua tham số — không chỉnh sửa mã nguồn thành phần."
            : "Every UI building block used across the Otter Beer website — customize through props, not by editing component source."}
        </p>
      </div>

      {/* 1. Buttons */}
      <section id="buttons" className="flex flex-col gap-8">
        <SectionHeading title={isVi ? "Nút bấm" : "Buttons"} />
        <Preview className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-on-surface">
              {isVi ? "Chính (Solid)" : "Primary (Solid)"}
            </h3>
            <div className="flex flex-wrap items-center gap-4">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large CTA</Button>
              <Button disabled>Disabled</Button>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-on-surface">
              {isVi ? "Phụ (Outline)" : "Secondary (Outline)"}
            </h3>
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="secondary" size="sm">
                Small
              </Button>
              <Button variant="secondary" size="md">
                Medium
              </Button>
              <Button variant="secondary" disabled>
                Disabled
              </Button>
              <Button variant="secondary">
                <CartIcon width={15} height={15} />
                {isVi ? "Thêm vào giỏ" : "Add to Cart"}
              </Button>
            </div>
          </div>
        </Preview>
      </section>

      {/* 2. Form fields */}
      <section id="forms" className="flex flex-col gap-8">
        <SectionHeading title={isVi ? "Trường nhập liệu" : "Input Fields"} />
        <Preview className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="flex flex-col gap-6">
            <Input label={isVi ? "Trường tiêu chuẩn" : "Standard Input"} placeholder={isVi ? "Nhập email của bạn" : "Enter your email address"} />
            <Input
              label={isVi ? "Trường có biểu tượng" : "Input with Icon"}
              placeholder={isVi ? "Tìm bia vùng biển..." : "Search coastal brews..."}
              icon={<SearchIcon width={18} height={18} />}
            />
            <Input
              label={isVi ? "Trạng thái lỗi" : "Error State"}
              defaultValue="invalid@email"
              error={isVi ? "Vui lòng nhập địa chỉ email hợp lệ." : "Please enter a valid email address."}
            />
          </div>
          <div className="flex flex-col gap-6">
            <Select
              label={isVi ? "Danh sách chọn" : "Dropdown Select"}
              placeholder={isVi ? "Chọn loại bia..." : "Select a beer style..."}
              options={[
                { value: "pale-ale", label: "Pale Ale" },
                { value: "pilsner", label: "Pilsner" },
                { value: "stout", label: "Stout" },
              ]}
            />
            <Textarea
              label={isVi ? "Tin nhắn (Textarea)" : "Message (Textarea)"}
              placeholder={isVi ? "Chúng tôi có thể giúp gì?" : "How can we help you?"}
            />
          </div>
        </Preview>
      </section>

      {/* 3. Cards */}
      <section id="cards" className="flex flex-col gap-8">
        <SectionHeading title={isVi ? "Thẻ" : "Cards"} />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <FeatureCard
            title={isVi ? "Tham quan nhà máy" : "Brewery Tours"}
            description={
              isVi
                ? "Trải nghiệm sự tinh xảo phía sau các loại bia ale vùng biển. Đi qua xưởng nấu và nếm thử trực tiếp từ bồn."
                : "Experience the craftsmanship behind our coastal ales. Walk through the brewhouse and taste directly from the tanks."
            }
            cta={{ label: isVi ? "Đặt ngay" : "Book Now", href: "#" }}
          />
          <FeatureCard
            variant="premium"
            title={isVi ? "Ưu đãi thành viên" : "Membership Perks"}
            description={
              isVi
                ? "Tham gia Wharf Club để được ưu tiên tiếp cận các phiên bản theo mùa và các buổi nếm thử miễn phí."
                : "Join the Wharf Club for exclusive early access to seasonal releases and complimentary tastings."
            }
            cta={{ label: isVi ? "Khám phá quyền lợi" : "Explore Benefits", href: "#" }}
          />
          <FeatureCard
            variant="dark"
            eyebrow={isVi ? "PHIÊN BẢN GIỚI HẠN" : "Limited Release"}
            title="Otter's Return Stout"
            description={
              isVi
                ? "Một loại ale đậm đà với hương vị muối biển và socola đen. Chỉ có tại phòng nếm thử."
                : "A rich, dark ale with notes of sea salt and dark chocolate. Available only at the taproom."
            }
            footer={
              <>
                <span className="text-sm font-bold tracking-wide">ABV: 8.5%</span>
                <CartIcon width={18} height={18} />
              </>
            }
          />
        </div>
      </section>

      {/* 4. Data tables */}
      <section id="data-table" className="flex flex-col gap-8">
        <SectionHeading title={isVi ? "Bảng dữ liệu" : "Data Tables"} />
        <DataTable
          title={isVi ? "Kho phòng nếm thử" : "Taproom Inventory"}
          columns={beerColumns}
          rows={BEER_ROWS}
          rowKey={(row) => row.name}
        />
      </section>

      {/* 5. Avatars & badges */}
      <section id="avatars" className="flex flex-col gap-8">
        <SectionHeading title={isVi ? "Ảnh đại diện & Huy hiệu" : "Avatars & Badges"} />
        <Preview className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">
              {isVi ? "Thành viên nhóm" : "Team Members"}
            </h3>
            <div className="flex flex-wrap items-center gap-8">
              <div className="flex items-center gap-4">
                <Avatar initials="SJ" online />
                <div>
                  <p className="font-display text-lg text-primary">Sarah Jenkins</p>
                  <Badge variant="primary">{isVi ? "BẬC THẦY NẤU BIA" : "MASTER BREWER"}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Avatar initials="MR" />
                <div>
                  <p className="font-display text-lg text-primary">Mark Reyes</p>
                  <Badge variant="neutral">{isVi ? "HẬU CẦN" : "LOGISTICS"}</Badge>
                </div>
              </div>
              <div className="ml-auto">
                <AvatarGroup
                  items={[{ initials: "JD" }, { initials: "AL" }, { initials: "KP" }, { initials: "RT" }]}
                  max={2}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">
              {isVi ? "Chỉ báo trạng thái" : "Status Indicators"}
            </h3>
            <div className="flex flex-wrap gap-4">
              <StatusBadge tone="pending">{isVi ? "CHỜ XỬ LÝ" : "PENDING"}</StatusBadge>
              <StatusBadge tone="active">{isVi ? "HOẠT ĐỘNG" : "ACTIVE"}</StatusBadge>
              <StatusBadge tone="featured">{isVi ? "NỔI BẬT" : "FEATURED"}</StatusBadge>
              <StatusBadge tone="alert">{isVi ? "CẢNH BÁO" : "ALERT"}</StatusBadge>
            </div>
          </div>
        </Preview>
      </section>

      {/* 6. Accordions & lists */}
      <section id="accordions" className="flex flex-col gap-8">
        <SectionHeading title={isVi ? "Accordion & Danh sách" : "Accordions & Lists"} />
        <div className="grid grid-cols-1 gap-16 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <h3 className="font-display text-xl tracking-wide text-primary">
              {isVi ? "Câu hỏi thường gặp" : "Frequently Asked Questions"}
            </h3>
            <Accordion
              defaultOpenIndex={0}
              items={[
                {
                  question: isVi ? "CÓ BÁN BIA THÙNG CHO KHÁCH LẺ KHÔNG?" : "DO YOU OFFER KEG SALES TO THE PUBLIC?",
                  answer: isVi
                    ? "Có, chúng tôi bán thùng 1/6 và 1/2 barrel của các dòng bia chủ lực. Vui lòng đặt trước ít nhất 48 giờ."
                    : "Yes, we offer 1/6 and 1/2 barrel kegs of our core lineup for public purchase. We recommend reserving at least 48 hours in advance.",
                },
                {
                  question: isVi ? "CÓ CHO PHÉP CHÓ Ở KHU VỰC BẾN CẢNG KHÔNG?" : "ARE DOGS ALLOWED ON THE WHARF?",
                  answer: isVi
                    ? "Chó được chào đón ở khu vực ngoài trời với dây xích."
                    : "Well-behaved leashed dogs are welcome in our outdoor seating area.",
                },
                {
                  question: isVi ? "TÔI CÓ THỂ TỔ CHỨC SỰ KIỆN RIÊNG KHÔNG?" : "CAN I HOST A PRIVATE EVENT?",
                  answer: isVi
                    ? "Có, phòng nếm thử của chúng tôi có thể đặt cho các sự kiện riêng."
                    : "Yes, our taproom is available to book for private events.",
                },
              ]}
            />
          </div>
          <div className="flex flex-col gap-4">
            <h3 className="font-display text-xl tracking-wide text-primary">
              {isVi ? "Hoạt động gần đây" : "Recent Activities"}
            </h3>
            <ActivityList
              footer={
                <span className="text-sm font-bold uppercase tracking-wide text-primary">
                  {isVi ? "Xem tất cả lịch sử" : "View All History"}
                </span>
              }
              items={[
                {
                  icon: <BoxIcon width={18} height={18} />,
                  iconBgClassName: "bg-primary/10 text-primary",
                  title: isVi ? "Mẻ #402 lên men hoàn tất" : "Batch #402 Fermentation Complete",
                  subtitle: isVi ? "Harbor Pale Ale đã chuyển sang bồn ủ trong." : "Harbor Pale Ale has been moved to brite tanks.",
                  timestamp: isVi ? "2 GIỜ TRƯỚC" : "2 HOURS AGO",
                },
                {
                  icon: <ClipboardIcon width={18} height={18} />,
                  iconBgClassName: "bg-secondary-container/40 text-secondary",
                  title: isVi ? "Lô hàng mới đã đến" : "New Shipment Arrived",
                  subtitle: isVi ? "Nhận 500kg hoa bia Cascade." : "Received 500kg of Cascade hops.",
                  timestamp: isVi ? "HÔM QUA" : "YESTERDAY",
                },
                {
                  icon: <UserIcon width={18} height={18} />,
                  iconBgClassName: "bg-surface-container-high text-on-surface-variant",
                  title: isVi ? "Đặt lịch tham quan" : "Tour Group Booked",
                  subtitle: isVi ? "Đặt chỗ nếm thử riêng cho nhóm 12 người." : "Private tasting reserved for a party of 12.",
                  timestamp: "MAR 12, 2024",
                },
              ]}
            />
          </div>
        </div>
      </section>

      {/* 7. Navigation */}
      <section id="navigation" className="flex flex-col gap-8">
        <SectionHeading title={isVi ? "Điều hướng" : "Navigation"} />

        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">Breadcrumbs</h3>
          <Preview>
            <Breadcrumbs
              items={[
                { label: isVi ? "TRANG CHỦ" : "HOME", href: "#" },
                { label: "BLOG", href: "#" },
                { label: isVi ? "BÀI VIẾT MẪU" : "SAMPLE POST" },
              ]}
            />
          </Preview>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">
              {isVi ? "Tab gạch chân" : "Underline Tabs"}
            </h3>
            <Preview>
              <Tabs
                variant="underline"
                items={[
                  { value: "overview", label: isVi ? "Tổng quan" : "Overview" },
                  { value: "ingredients", label: isVi ? "Thành phần" : "Ingredients" },
                  { value: "reviews", label: isVi ? "Đánh giá" : "Reviews" },
                ]}
              />
            </Preview>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">
              {isVi ? "Tab dạng viên" : "Pill Tabs"}
            </h3>
            <Preview>
              <Tabs
                variant="pill"
                items={[
                  { value: "weekly", label: isVi ? "Hàng tuần" : "Weekly" },
                  { value: "monthly", label: isVi ? "Hàng tháng" : "Monthly" },
                  { value: "yearly", label: isVi ? "Hàng năm" : "Yearly" },
                ]}
              />
            </Preview>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">Pagination</h3>
          <Preview className="flex justify-center">
            <Pagination page={1} totalPages={12} buildHref={() => "#"} variant="pill" />
          </Preview>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">
              {isVi ? "Thanh điều hướng" : "Sidebar Drawer"}
            </h3>
            <div className="h-[340px]">
              <NavSidebar
                header={isVi ? "QUẢN TRỊ" : "BREW ADMIN"}
                items={[
                  { label: isVi ? "Bia" : "Brews", icon: <BoxIcon width={18} height={18} />, href: "#", active: true },
                  { label: isVi ? "Người dùng" : "Users", icon: <UserIcon width={18} height={18} />, href: "#" },
                  { label: isVi ? "Thống kê" : "Analytics", icon: <BarChartIcon width={18} height={18} />, href: "#" },
                ]}
                footer={
                  <a href="#" className="flex items-center gap-3 rounded px-3 py-2 text-sm text-on-surface-variant no-underline">
                    <SettingsIcon width={18} height={18} />
                    {isVi ? "Cài đặt" : "Settings"}
                  </a>
                }
              />
            </div>
          </div>
          <div className="flex flex-col gap-3 md:col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">
              {isVi ? "Menu thả xuống" : "User Menu Dropdown"}
            </h3>
            <Preview className="flex h-[340px] items-start justify-end">
              <DropdownMenu
                trigger={
                  <span className="flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-2 shadow-sm">
                    <Avatar initials="JD" size="sm" />
                    <ChevronDownIcon width={12} height={12} />
                  </span>
                }
                header={{ title: "John Doe", subtitle: "john@example.com" }}
                items={[
                  {
                    label: isVi ? "Hồ sơ của tôi" : "My Profile",
                    description: isVi ? "Trang hiện tại" : "You're here",
                    icon: <UserIcon width={16} height={16} />,
                    href: "#",
                    active: true,
                  },
                  {
                    label: isVi ? "Lịch sử đơn hàng" : "Order History",
                    icon: <ClipboardIcon width={16} height={16} />,
                    href: "#",
                  },
                  {
                    label: isVi ? "Nâng cấp gói" : "Upgrade Plan",
                    description: isVi ? "Mở khoá tính năng cao cấp" : "Unlock premium features",
                    trailing: <ChevronRightIcon width={12} height={12} />,
                    featured: true,
                    href: "#",
                  },
                  { label: isVi ? "Cài đặt" : "Settings", icon: <SettingsIcon width={16} height={16} />, href: "#" },
                  { label: isVi ? "Đăng xuất" : "Logout", icon: <LogoutIcon width={16} height={16} />, danger: true, dividerBefore: true, href: "#" },
                ]}
              />
            </Preview>
          </div>
        </div>
      </section>

      {/* 8. Feedback & overlays */}
      <section id="feedback" className="flex flex-col gap-8">
        <SectionHeading title={isVi ? "Phản hồi & Lớp phủ" : "Feedback & Overlays"} />

        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">Modals</h3>
          <Preview className="flex justify-center">
            <ModalDemo
              triggerLabel={isVi ? "Mở xác minh độ tuổi" : "Open Age Verification"}
              title={isVi ? "XÁC MINH ĐỘ TUỔI" : "AGE VERIFICATION"}
              description={
                isVi
                  ? "Bạn có đủ tuổi uống rượu bia hợp pháp tại khu vực của mình không?"
                  : "Are you of legal drinking age in your location?"
              }
              cancelLabel={isVi ? "Huỷ" : "Cancel"}
              confirmLabel={isVi ? "Xác nhận" : "Confirm"}
            />
          </Preview>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">Alerts</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Alert
              variant="info"
              title={isVi ? "Phiên bản mới theo mùa" : "New Seasonal Release"}
              description={isVi ? "Wharfside Wheat đã quay lại trong thời gian giới hạn." : "Our Wharfside Wheat is back on tap for a limited time."}
            />
            <Alert
              variant="success"
              title={isVi ? "Đơn hàng đã xác nhận" : "Order Confirmed"}
              description={isVi ? "Thùng IPA của bạn đã sẵn sàng giao." : "Your case of IPA has been prepared for local delivery."}
            />
            <Alert
              variant="warning"
              title={isVi ? "Cảnh báo sắp hết hàng" : "Low Stock Warning"}
              description={isVi ? "Chỉ còn 3 thùng Golden Ale." : "Only 3 kegs remaining of the Golden Ale."}
            />
            <Alert
              variant="error"
              title={isVi ? "Sự cố giao hàng" : "Delivery Issue"}
              description={isVi ? "Không thể giao hàng đến mã bưu chính yêu cầu." : "We are unable to deliver to the requested postal code."}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">
            {isVi ? "Thông báo & Chú giải" : "Toasts & Tooltips"}
          </h3>
          <Preview className="relative flex min-h-[220px] items-center justify-center gap-6">
            <Tooltip label={isVi ? "Giỏ hàng" : "Cart"}>
              <span className="flex items-center justify-center rounded border border-outline-variant/30 bg-surface-container-lowest p-3 shadow-sm">
                <CartIcon width={20} height={20} />
              </span>
            </Tooltip>
            <Tooltip label={isVi ? "Trợ giúp" : "Help"}>
              <span className="flex items-center justify-center rounded border border-outline-variant/30 bg-surface-container-lowest p-3 shadow-sm">
                <UserIcon width={20} height={20} />
              </span>
            </Tooltip>
            <div className="absolute bottom-6 right-6">
              <Toast message={isVi ? "Đã lưu cài đặt" : "Settings Saved"} />
            </div>
          </Preview>
        </div>

        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">
              {isVi ? "Bộ tải" : "Spinners"}
            </h3>
            <Preview className="flex flex-wrap justify-center gap-16">
              <Spinner variant="hop" label={isVi ? "XOAY HOA BIA" : "HOP ROTATOR"} />
              <Spinner variant="pour" label={isVi ? "RÓT BIA" : "LIQUID POUR"} />
              <Spinner variant="ripple" label={isVi ? "GỢN SÓNG" : "COASTAL RIPPLE"} />
            </Preview>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">Skeletons</h3>
            <Preview className="flex justify-center">
              <SkeletonCard />
            </Preview>
            <Preview className="flex flex-col gap-2">
              <Skeleton width="60%" />
              <Skeleton width="90%" />
              <Skeleton width="40%" />
            </Preview>
          </div>
        </div>
      </section>
    </div>
  );
}
