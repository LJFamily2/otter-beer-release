import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { blogPostService } from "@/services/BlogPostService";
import { pickTranslation } from "@/lib/utils/BlogPostPresenter";
import { formatDate } from "@/lib/utils/formatDate";
import {
  buildBlogPostMetadata,
  buildBlogPostJsonLd,
  blogPostBreadcrumbTrail,
  localizedPath,
  toBreadcrumbItems,
} from "@/lib/seo";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { publicImageUrl } from "@/lib/storage/constants";
import type { PopulatedAuthor } from "@/types/blogPost";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface BlogDetailPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

// Sanitized post HTML (see HtmlSanitizer) is rendered via
// dangerouslySetInnerHTML, so its typography is styled through Tailwind's
// arbitrary descendant-selector variants on the wrapping div.
const articleBodyStyles =
  "[&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:font-display [&_h2]:text-[26px] [&_h2]:text-primary " +
  "[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:font-display [&_h3]:text-xl [&_h3]:text-primary " +
  "[&_p]:mb-4 [&_ul]:mb-4 [&_ul]:pl-6 [&_ol]:mb-4 [&_ol]:pl-6 " +
  "[&_blockquote]:my-6 [&_blockquote]:border-l-[3px] [&_blockquote]:border-secondary-fixed-dim [&_blockquote]:pl-5 [&_blockquote]:italic [&_blockquote]:text-on-surface-variant " +
  "[&_img]:my-4 [&_img]:max-w-full [&_img]:rounded";

export async function generateMetadata({
  params,
}: BlogDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  try {
    const post = await blogPostService.getPublishedByLocaleSlug(locale, slug);
    if (!post) return {};
    const translation = pickTranslation(post, locale);
    if (!translation) return {};
    return buildBlogPostMetadata(post, locale, translation);
  } catch {
    return {};
  }
}

export default async function BlogDetailPage({
  params,
}: BlogDetailPageProps) {
  const { locale, slug } = await params;
  const isVi = locale === "vi";

  let post = null;
  try {
    post = await blogPostService.getPublishedByLocaleSlug(locale, slug);
  } catch {
    notFound();
  }
  if (!post) notFound();

  const translation = pickTranslation(post, locale);
  if (!translation) notFound();

  const [recentPosts, allTags] = await Promise.all([
    blogPostService.getRecentPublished(3, String(post._id)).catch(() => []),
    blogPostService.getPublishedTags().catch(() => []),
  ]);

  const author = post.authorId as unknown as PopulatedAuthor;
  const homeLabel = isVi ? "Trang chủ" : "Home";
  const blogLabel = isVi ? "Tin tức" : "News";
  // Same trail the JSON-LD below publishes — see blogPostBreadcrumbTrail.
  const trail = blogPostBreadcrumbTrail(
    homeLabel,
    blogLabel,
    translation.title,
    translation.slug
  );
  // Full page graph (Organization + WebSite + BlogPosting + BreadcrumbList),
  // not just the article node — see buildBlogPostJsonLd.
  const jsonLd = buildBlogPostJsonLd(
    post,
    locale,
    translation,
    author?.name ?? "Otter Beer",
    blogLabel,
    homeLabel
  );

  return (
    <div className="mx-auto grid max-w-[1280px] grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] gap-16 px-5 pt-28 sm:pt-36 lg:pt-40 pb-16 max-[900px]:grid-cols-1">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article>
        <Breadcrumbs items={toBreadcrumbItems(locale, trail)} className="mb-6" />

        <div className="mb-8">
          <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-secondary">
            {post.tags[0] ? `${post.tags[0]} • ` : ""}
            {post.publishedAt ? formatDate(post.publishedAt, locale) : ""}
          </p>
          <h1 className="my-4 text-[clamp(32px,5vw,56px)] tracking-wide text-primary">
            {translation.title}
          </h1>
          <p className="text-lg leading-relaxed text-on-surface-variant">
            {translation.excerpt}
          </p>
        </div>

        {post.coverImageKey ? (
          <div className="relative my-8 aspect-video w-full overflow-hidden rounded-lg shadow-sm">
            <Image
              src={publicImageUrl(post.coverImageKey)}
              alt={
                isVi
                  ? `Ảnh bìa bài viết: ${translation.title}`
                  : `Cover image for: ${translation.title}`
              }
              fill
              className="object-cover"
              sizes="(max-width: 900px) 100vw, 66vw"
              priority
            />
          </div>
        ) : null}

        <div
          className={`text-[17px] leading-[1.75] text-on-surface ${articleBodyStyles}`}
          // Safe: sanitized server-side with DOMPurify before storage — see HtmlSanitizer.
          dangerouslySetInnerHTML={{ __html: translation.content }}
        />

        {post.tags.length > 0 ? (
          <div className="mt-8 flex flex-wrap gap-2 border-t border-[rgba(196,198,210,0.3)] pt-8">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
      </article>

      <aside className="flex flex-col gap-8">
        {author?.name ? (
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-surface-container-high">
                {/* Decorative by WCAG H67: the author's name is rendered as
                    text immediately beside this avatar inside the same card,
                    so a descriptive alt would announce the name twice. */}
                {author.image ? (
                  <Image src={author.image} alt="" width={56} height={56} />
                ) : null}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-on-surface-variant">
                  {isVi ? "Tác giả" : "Author"}
                </p>
                <p className="font-display text-base tracking-wide text-primary">
                  {author.name}
                </p>
              </div>
            </div>
          </Card>
        ) : null}

        {recentPosts.length > 0 ? (
          <Card className="p-6">
            <h2 className="mb-4 font-display text-base tracking-wide text-primary">
              {isVi ? "Bài viết gần đây" : "Recent Logs"}
            </h2>
            <div className="flex flex-col gap-4">
              {recentPosts.map((recent) => {
                const recentTranslation = pickTranslation(recent, locale);
                if (!recentTranslation) return null;
                return (
                  <Link
                    key={String(recent._id)}
                    href={localizedPath(
                      locale,
                      `/blog/${recentTranslation.slug}`
                    )}
                    className="flex gap-3 text-inherit no-underline"
                  >
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded bg-surface-container-high">
                      {recent.coverImageKey ? (
                        <Image
                          src={publicImageUrl(recent.coverImageKey)}
                          alt={
                            isVi
                              ? `Ảnh bìa bài viết: ${recentTranslation.title}`
                              : `Cover image for: ${recentTranslation.title}`
                          }
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      ) : null}
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-tight text-on-surface">
                        {recentTranslation.title}
                      </p>
                      {recent.publishedAt ? (
                        <p className="mt-1 text-xs uppercase tracking-wide text-on-surface-variant">
                          {formatDate(recent.publishedAt, locale)}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          </Card>
        ) : null}

        {allTags.length > 0 ? (
          <Card className="p-6">
            <h2 className="mb-4 font-display text-base tracking-wide text-primary">
              {isVi ? "Chủ đề" : "Topics"}
            </h2>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <Link
                  key={tag}
                  href={`${localizedPath(locale, "/blog")}?tag=${encodeURIComponent(tag)}`}
                  className="no-underline"
                >
                  <Badge variant="outline">{tag}</Badge>
                </Link>
              ))}
            </div>
          </Card>
        ) : null}
      </aside>
    </div>
  );
}
