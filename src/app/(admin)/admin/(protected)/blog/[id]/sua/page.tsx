import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { MODULE_KEYS } from "@/config/permissions";
import { blogPostService } from "@/services/BlogPostService";
import { PostForm, type PostFormInitialData } from "../../PostForm";

export const metadata: Metadata = {
  title: "Chỉnh sửa bài viết",
  robots: { index: false, follow: false },
};

interface EditBlogPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBlogPostPage({
  params,
}: EditBlogPostPageProps) {
  const session = await auth();
  if (!session?.user?.permissions?.[MODULE_KEYS.NEWS_BLOG]?.edit) {
    redirect("/admin/blog");
  }

  const { id } = await params;
  const post = await blogPostService.getById(id);
  if (!post) {
    notFound();
  }

  const initialData: PostFormInitialData = {
    coverImageKey: post.coverImageKey,
    tags: post.tags,
    status: post.status,
    translations: Object.fromEntries(
      post.translations.map((t) => [
        t.locale,
        {
          title: t.title,
          slug: t.slug,
          excerpt: t.excerpt,
          content: t.content,
          seoTitle: t.seoTitle ?? "",
          seoDescription: t.seoDescription ?? "",
          seoKeywords: t.seoKeywords.join(", "),
          ogImageKey: t.ogImageKey,
        },
      ])
    ) as PostFormInitialData["translations"],
  };

  return <PostForm mode="edit" postId={id} initialData={initialData} />;
}
