import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { beerService } from "@/services/BeerService";
import { MODULE_KEYS } from "@/config/permissions";
import { formatDate } from "@/lib/utils/formatDate";
import { PlusIcon, SearchIcon, EditIcon, TrashIcon } from "@/components/admin/icons";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { buttonVariants } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { rowActionButtonClass } from "@/components/admin/classNames";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";

export const metadata: Metadata = {
  title: "Sản phẩm bia",
  robots: { index: false, follow: false },
};

interface BeerListPageProps {
  searchParams: Promise<{ page?: string; search?: string }>;
}

export default async function BeerListPage({ searchParams }: BeerListPageProps) {
  const session = await auth();
  const grant = session?.user?.permissions?.[MODULE_KEYS.BEERS];

  if (!grant?.view) {
    return (
      <div className="p-16 text-center text-on-surface-variant">
        Bạn không có quyền xem nội dung này.
      </div>
    );
  }

  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const search = params.search?.trim() || undefined;

  const result = await beerService.list({ search }, { page, pageSize: 10 });

  const buildPageHref = (targetPage: number) => {
    const qs = new URLSearchParams();
    if (search) qs.set("search", search);
    qs.set("page", String(targetPage));
    return `/admin/beers?${qs.toString()}`;
  };

  type BeerRow = (typeof result.items)[number];

  const columns: DataTableColumn<BeerRow>[] = [
    {
      key: "style",
      header: "Dòng bia",
      render: (beer) => {
        const translation = beer.translations.find((t) => t.locale === "vi") ?? beer.translations[0];
        return (
          <Link
            href={`/admin/beers/${String(beer._id)}/sua`}
            className="text-inherit no-underline hover:underline"
          >
            {translation?.style ?? "(Chưa có tên)"}
          </Link>
        );
      },
    },
    {
      key: "specs",
      header: "Thông số",
      render: (beer) => `${beer.abv}% ABV · ${beer.ibu} IBU`,
    },
    {
      key: "featured",
      header: "Nổi bật",
      render: (beer) => (beer.isFeatured ? <Badge variant="primary">Trang chủ</Badge> : "—"),
    },
    {
      key: "date",
      header: "Ngày tạo",
      render: (beer) => formatDate(beer.createdAt, "vi"),
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (beer) => (
        <Badge variant={beer.status === "published" ? "primary" : "neutral"}>
          {beer.status === "published" ? "Đã xuất bản" : "Bản nháp"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Thao tác",
      align: "right",
      render: (beer) => {
        const beerId = String(beer._id);
        return (
          <div className="inline-flex gap-1">
            {grant.edit ? (
              <Link
                href={`/admin/beers/${beerId}/sua`}
                className={rowActionButtonClass}
                aria-label="Sửa"
              >
                <EditIcon width={15} height={15} />
              </Link>
            ) : null}
            {grant.delete ? (
              <ConfirmDeleteButton
                title="Xác nhận xóa sản phẩm"
                description="Xóa sản phẩm này? Hành động này không thể hoàn tác."
                deleteUrl={`/api/beers/${beerId}`}
                useRowActionStyle
              >
                <TrashIcon width={15} height={15} />
              </ConfirmDeleteButton>
            ) : null}
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <Breadcrumbs
        items={[
          { label: "Quản trị", href: "/admin" },
          { label: "Sản phẩm bia" },
        ]}
      />

      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[rgba(196,198,210,0.3)] pb-4">
        <div>
          <h1 className="text-4xl tracking-wide text-primary">Quản lý Sản phẩm bia</h1>
          <p className="mt-2 text-base text-on-surface-variant">
            Quản lý danh sách sản phẩm và chọn sản phẩm nổi bật hiển thị trên trang chủ.
          </p>
        </div>
        {grant.add ? (
          <Link href="/admin/beers/moi" className={buttonVariants("primary")}>
            <PlusIcon width={14} height={14} />
            Tạo sản phẩm
          </Link>
        ) : null}
      </div>

      <Card className="p-4 text-sm text-on-surface-variant">
        Chỉ sản phẩm được đánh dấu <strong>Nổi bật</strong> và ở trạng thái{" "}
        <strong>Đã xuất bản</strong> mới hiển thị trên trang chủ.
      </Card>

      <DataTable
        title="Danh sách sản phẩm"
        rows={result.items}
        columns={columns}
        rowKey={(beer) => String(beer._id)}
        emptyMessage={
          search ? `Không tìm thấy sản phẩm nào khớp với "${search}".` : "Chưa có sản phẩm nào."
        }
        action={
          <form className="flex gap-2" action="/admin/beers" method="get">
            <Input
              type="search"
              name="search"
              placeholder="Tìm kiếm sản phẩm..."
              defaultValue={search}
              wrapperClassName="min-w-[220px]"
              className="py-2.5"
            />
            <button type="submit" className={rowActionButtonClass} aria-label="Tìm kiếm">
              <SearchIcon width={16} height={16} />
            </button>
          </form>
        }
        footer={
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-on-surface-variant">
            <span>
              Hiển thị {result.items.length === 0 ? 0 : (result.page - 1) * result.pageSize + 1}
              {" "}đến {Math.min(result.page * result.pageSize, result.total)} trong tổng số{" "}
              {result.total} sản phẩm
            </span>
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              buildHref={buildPageHref}
              variant="compact"
            />
          </div>
        }
      />
    </div>
  );
}
