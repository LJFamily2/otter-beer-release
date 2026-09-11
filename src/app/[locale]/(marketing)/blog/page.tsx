import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { blogPostService } from "@/services/BlogPostService";
import { pickTranslation } from "@/lib/utils/BlogPostPresenter";
import {
  buildBlogListMetadata,
  buildBreadcrumbJsonLd,
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
  jsonLdGraph,
  localizedPath,
  toBreadcrumbItems,
  type BreadcrumbEntry,
} from "@/lib/seo";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { publicImageUrl } from "@/lib/storage/constants";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";

const PAGE_SIZE = 10;

interface BlogListPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; tag?: string }>;
}

export async function generateMetadata({
  params,
}: BlogListPageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildBlogListMetadata(locale);
}

export default async function BlogListPage({
  params,
  searchParams,
}: BlogListPageProps) {
  const { locale } = await params;
  const { page: pageParam, tag } = await searchParams;
  const page = Number(pageParam ?? "1") || 1;
  const isVi = locale === "vi";

  const result = await blogPostService
    .listPublished({
      page,
      pageSize: PAGE_SIZE,
      tag,
    })
    .catch(() => ({ items: [], totalPages: 1, total: 0 }));

  // Only feature a post on the unfiltered first page — a tag filter should
  // show a plain filtered grid, not a featured pick that may not match it.
  const showFeatured = page === 1 && !tag;
  const featured = showFeatured ? (result.items[0] ?? null) : null;
  const rest = showFeatured ? result.items.slice(1) : result.items;
  const featuredTranslation = featured ? pickTranslation(featured, locale) : null;

  const buildHref = (targetPage: number) =>
    `${localizedPath(locale, "/blog")}?page=${targetPage}`;

  // One trail, two consumers — the JSON-LD and the visible <Breadcrumbs>.
  const trail: BreadcrumbEntry[] = [
    { name: isVi ? "Trang chủ" : "Home", path: "/" },
    { name: isVi ? "Tin tức" : "News", path: "/blog" },
  ];

  const jsonLd = jsonLdGraph([
    buildOrganizationJsonLd(),
    buildWebSiteJsonLd(locale),
    buildBreadcrumbJsonLd(locale, trail),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Breadcrumbs
        items={toBreadcrumbItems(locale, trail)}
        className="mx-auto max-w-[1280px] px-5 pt-24 sm:pt-32 lg:pt-36"
      />

      <section className="px-5 pt-8 text-center">
        {/* Kept in title case rather than the uppercase other page headings
            use: at this size the Vietnamese title stacks diacritics above the
            cap height, and 0.92 leading leaves them no room. The tight leading
            and negative tracking are what make it read as a masthead block
            instead of the stretched single line `tracking-wide` produced. */}
        <h1 className="mx-auto max-w-3xl text-[clamp(36px,5.5vw,52px)] leading-[0.95] tracking-[-0.02em] text-primary">
          {isVi ? "Nhật Ký Bia Chú Rái Cá" : "Otter Beer Journal"}
        </h1>
        <div className="mx-auto mt-6 h-[3px] w-16 bg-secondary-fixed-dim" />
      </section>

      <div className="mx-auto flex max-w-[1280px] flex-col gap-16 px-5 py-16">
        {featured && featuredTranslation ? (
          <Link
            href={localizedPath(locale, `/blog/${featuredTranslation.slug}`)}
            className="relative block min-h-[420px] overflow-hidden rounded-lg border border-[rgba(196,198,210,0.3)] text-inherit no-underline shadow-sm"
          >
            {featured.coverImageKey ? (
              <div className="absolute inset-0">
                <Image
                  src={publicImageUrl(featured.coverImageKey)}
                  alt={
                    isVi
                      ? `Ảnh bìa bài viết: ${featuredTranslation.title}`
                      : `Cover image for: ${featuredTranslation.title}`
                  }
                  fill
                  className="object-cover"
                  sizes="(max-width: 1320px) calc(100vw - 40px), 1280px"
                  priority
                />
              </div>
            ) : null}
            <div className="relative flex min-h-[580px] flex-col justify-end bg-gradient-to-t from-white from-10% via-white/55 via-55% to-white/10 p-12">
              {featured.tags[0] ? (
                <Badge variant="overlay" className="mb-2 self-start">
                  {featured.tags[0]}
                </Badge>
              ) : null}
              <h2 className="mb-2 text-[clamp(28px,4vw,44px)] tracking-wide text-primary">
                {featuredTranslation.title}
              </h2>
              <p className="mb-2 max-w-[640px] text-[17px] leading-relaxed text-on-surface-variant">
                {featuredTranslation.excerpt}
              </p>
              <span className="inline-flex items-center gap-2 text-sm font-bold text-primary">
                {isVi ? "Đọc câu chuyện →" : "Read Story →"}
              </span>
            </div>
          </Link>
        ) : null}

        {result.items.length === 0 ? (
          <p className="py-20 text-center text-on-surface-variant">
            {isVi ? "Chưa có bài viết nào." : "No posts yet."}
          </p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
            {rest.map((post) => {
              const translation = pickTranslation(post, locale);
              if (!translation) return null;
              return (
                <Link
                  key={String(post._id)}
                  href={localizedPath(locale, `/blog/${translation.slug}`)}
                  className="flex flex-col overflow-hidden rounded-lg border border-[rgba(196,198,210,0.3)] bg-surface-container-lowest text-inherit no-underline shadow-[0px_1px_2px_0px_rgba(0,40,103,0.05)]"
                >
                  <div className="relative aspect-[16/10] border-b-2 border-secondary-fixed-dim bg-surface-container-high">
                    {post.coverImageKey ? (
                      <Image
                        src={publicImageUrl(post.coverImageKey)}
                        alt={
                          isVi
                            ? `Ảnh bìa bài viết: ${translation.title}`
                            : `Cover image for: ${translation.title}`
                        }
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 33vw"
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    {post.tags[0] ? (
                      <Badge variant="overlay" className="mb-2 self-start">
                        {post.tags[0]}
                      </Badge>
                    ) : null}
                    <h3 className="mb-2 text-xl tracking-wide text-primary">
                      {translation.title}
                    </h3>
                    <p className="mb-2 line-clamp-3 flex-1 text-[15px] leading-relaxed text-on-surface-variant">
                      {translation.excerpt}
                    </p>
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-primary">
                      {isVi ? "Đọc thêm →" : "Read More →"}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <Pagination
          page={page}
          totalPages={result.totalPages}
          buildHref={buildHref}
          variant="pill"
        />
      </div>
    </>
  );
}
