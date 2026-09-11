import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { blogPostService } from "@/services/BlogPostService";
import { pickTranslation } from "@/lib/utils/BlogPostPresenter";
import { formatDate } from "@/lib/utils/formatDate";
import type { PopulatedAuthor } from "@/types/blogPost";
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
  title: "Tin tức & Blog",
  robots: { index: false, follow: false },
};

interface BlogListPageProps {
  searchParams: Promise<{ page?: string; search?: string }>;
}

export default async function BlogListPage({
  searchParams,
}: BlogListPageProps) {
  const session = await auth();
  const grant = session?.user?.permissions?.news_blog;

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

  const [stats, result] = await Promise.all([
    blogPostService.getDashboardStats(),
    blogPostService.list({ search }, { page, pageSize: 10 }),
  ]);

  const buildPageHref = (targetPage: number) => {
    const qs = new URLSearchParams();
    if (search) qs.set("search", search);
    qs.set("page", String(targetPage));
    return `/admin/blog?${qs.toString()}`;
  };

  type PostRow = (typeof result.items)[number];

  const columns: DataTableColumn<PostRow>[] = [
    {
      key: "title",
      header: "Tiêu đề bài viết",
      render: (post) => {
        const translation = pickTranslation(post, "vi");
        return (
          <Link
            href={`/admin/blog/${String(post._id)}/sua`}
            className="text-inherit no-underline hover:underline"
          >
            {translation?.title ?? "(Chưa có tiêu đề)"}
          </Link>
        );
      },
    },
    {
      key: "author",
      header: "Tác giả",
      render: (post) => (post.authorId as unknown as PopulatedAuthor)?.name ?? "—",
    },
    {
      key: "date",
      header: "Ngày",
      render: (post) => formatDate(post.createdAt, "vi"),
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (post) => (
        <Badge variant={post.status === "published" ? "primary" : "neutral"}>
          {post.status === "published" ? "Đã xuất bản" : "Bản nháp"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Thao tác",
      align: "right",
      render: (post) => {
        const postId = String(post._id);
        return (
          <div className="inline-flex gap-1">
            {grant.edit ? (
              <Link
                href={`/admin/blog/${postId}/sua`}
                className={rowActionButtonClass}
                aria-label="Sửa"
              >
                <EditIcon width={15} height={15} />
              </Link>
            ) : null}
            {grant.delete ? (
              <ConfirmDeleteButton
                title="Xác nhận xóa bài viết"
                description="Xóa bài viết này? Hành động này không thể hoàn tác."
                deleteUrl={`/api/news-blog/${postId}`}
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
          { label: "Tin tức & Blog" },
        ]}
      />

      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[rgba(196,198,210,0.3)] pb-4">
        <div>
          <h1 className="text-4xl tracking-wide text-primary">
            Quản lý Tin tức & Blog
          </h1>
          <p className="mt-2 text-base text-on-surface-variant">
            Theo dõi bài viết, thông báo, và cập nhật từ nhà máy bia.
          </p>
        </div>
        {grant.add ? (
          <Link href="/admin/blog/moi" className={buttonVariants("primary")}>
            <PlusIcon width={14} height={14} />
            Tạo bài viết
          </Link>
        ) : null}
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6">
        <Card className="relative overflow-hidden p-6">
          <div className="absolute inset-x-0 top-0 h-1 bg-secondary-container" />
          <div className="text-sm font-bold uppercase tracking-wide text-on-surface-variant">
            Tổng số bài viết
          </div>
          <div className="mt-2 text-4xl tracking-wide text-primary">
            {stats.total}
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-sm font-bold uppercase tracking-wide text-on-surface-variant">
            Đã xuất bản
          </div>
          <div className="mt-2 text-4xl tracking-wide text-primary">
            {stats.published}
          </div>
          <div className="mt-2 text-xs text-on-surface-variant">
            Đang hiển thị trên trang web
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-sm font-bold uppercase tracking-wide text-on-surface-variant">
            Bản nháp
          </div>
          <div className="mt-2 text-4xl tracking-wide text-primary">
            {stats.draft}
          </div>
          <div className="mt-2 text-xs text-on-surface-variant">Cần xem lại</div>
        </Card>
      </div>

      <DataTable
        title="Bài viết gần đây"
        rows={result.items}
        columns={columns}
        rowKey={(post) => String(post._id)}
        emptyMessage={
          search
            ? `Không tìm thấy bài viết nào khớp với "${search}".`
            : "Chưa có bài viết nào."
        }
        action={
          <form className="flex gap-2" action="/admin/blog" method="get">
            <Input
              type="search"
              name="search"
              placeholder="Tìm kiếm bài viết..."
              defaultValue={search}
              wrapperClassName="min-w-[220px]"
              className="py-2.5"
            />
            <button
              type="submit"
              className={rowActionButtonClass}
              aria-label="Tìm kiếm"
            >
              <SearchIcon width={16} height={16} />
            </button>
          </form>
        }
        footer={
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-on-surface-variant">
            <span>
              Hiển thị {result.items.length === 0 ? 0 : (result.page - 1) * result.pageSize + 1}
              {" "}đến {Math.min(result.page * result.pageSize, result.total)} trong tổng số{" "}
              {result.total} bài viết
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
