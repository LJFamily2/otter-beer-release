import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { RouteGuard } from "@/lib/auth/RouteGuard";
import { MODULE_KEYS } from "@/config/permissions";
import {
  blogPostService,
  SlugConflictError,
} from "@/services/BlogPostService";
import { BlogPostUpdateSchema } from "@/lib/validation/blogPost";
import { withRateLimit } from "@/lib/rate-limit/withRateLimit";
import { mutationRateLimiter } from "@/lib/rate-limit/limiters";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const GET = RouteGuard.requirePermission<RouteParams>(
  MODULE_KEYS.NEWS_BLOG,
  "view",
  async (_request, context) => {
    const { id } = await context.params;
    const post = await blogPostService.getById(id);
    if (!post) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(post);
  }
);

export const PATCH = withRateLimit(
  mutationRateLimiter,
  RouteGuard.requirePermission<RouteParams>(
    MODULE_KEYS.NEWS_BLOG,
    "edit",
    async (request: NextRequest, context, session) => {
      const { id } = await context.params;
      const body = await request.json();
      const parsed = BlogPostUpdateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại các thông tin bắt buộc.", details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      try {
        const post = await blogPostService.update(
          id,
          parsed.data,
          session.user.id
        );
        if (!post) {
          return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        revalidatePath('/', 'layout');
        return NextResponse.json(post);
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

export const DELETE = withRateLimit(
  mutationRateLimiter,
  RouteGuard.requirePermission<RouteParams>(
    MODULE_KEYS.NEWS_BLOG,
    "delete",
    async (_request, context) => {
      const { id } = await context.params;
      const deleted = await blogPostService.delete(id);
      if (!deleted) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      revalidatePath('/', 'layout');
      return new NextResponse(null, { status: 204 });
    }
  ),
  "news-blog-write"
);
