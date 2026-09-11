import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { RouteGuard } from "@/lib/auth/RouteGuard";
import { MODULE_KEYS } from "@/config/permissions";
import {
  blogPostService,
  SlugConflictError,
} from "@/services/BlogPostService";
import { BlogPostCreateSchema } from "@/lib/validation/blogPost";
import type { BlogPostListFilters } from "@/repositories/BlogPostRepository";
import { withRateLimit } from "@/lib/rate-limit/withRateLimit";
import { mutationRateLimiter } from "@/lib/rate-limit/limiters";

export const GET = RouteGuard.requirePermission(
  MODULE_KEYS.NEWS_BLOG,
  "view",
  async (request: NextRequest) => {
    const { searchParams } = request.nextUrl;

    const filters: BlogPostListFilters = {};
    const status = searchParams.get("status");
    if (status === "draft" || status === "published") filters.status = status;
    const tag = searchParams.get("tag");
    if (tag) filters.tag = tag;
    const search = searchParams.get("search");
    if (search) filters.search = search;

    const page = Number(searchParams.get("page") ?? "1") || 1;
    const pageSize = Number(searchParams.get("pageSize") ?? "20") || 20;

    const result = await blogPostService.list(filters, { page, pageSize });
    return NextResponse.json(result);
  }
);

export const POST = withRateLimit(
  mutationRateLimiter,
  RouteGuard.requirePermission(
    MODULE_KEYS.NEWS_BLOG,
    "add",
    async (request: NextRequest, _context, session) => {
      const body = await request.json();
      const parsed = BlogPostCreateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại các thông tin bắt buộc.", details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      try {
        const post = await blogPostService.create(parsed.data, session.user.id);
        revalidatePath('/', 'layout');
        return NextResponse.json(post, { status: 201 });
      } catch (err) {
        if (err instanceof SlugConflictError) {
          return NextResponse.json({ error: err.message }, { status: 409 });
        }
        throw err;
      }
    }
  ),
  "news-blog-write"
);
