import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { MODULE_KEYS } from "@/config/permissions";
import { PostForm } from "../PostForm";

export const metadata: Metadata = {
  title: "Tạo bài viết",
  robots: { index: false, follow: false },
};

export default async function NewBlogPostPage() {
  const session = await auth();
  if (!session?.user?.permissions?.[MODULE_KEYS.NEWS_BLOG]?.add) {
    redirect("/admin/blog");
  }

  return <PostForm mode="create" />;
}
