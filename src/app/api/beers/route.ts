import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { RouteGuard } from "@/lib/auth/RouteGuard";
import { MODULE_KEYS } from "@/config/permissions";
import { beerService } from "@/services/BeerService";
import { BeerCreateSchema } from "@/lib/validation/beer";
import type { BeerListFilters } from "@/repositories/BeerRepository";
import { withRateLimit } from "@/lib/rate-limit/withRateLimit";
import { mutationRateLimiter } from "@/lib/rate-limit/limiters";

export const GET = RouteGuard.requirePermission(
  MODULE_KEYS.BEERS,
  "view",
  async (request: NextRequest) => {
    const { searchParams } = request.nextUrl;

    const filters: BeerListFilters = {};
    const status = searchParams.get("status");
    if (status === "draft" || status === "published") filters.status = status;
    const search = searchParams.get("search");
    if (search) filters.search = search;

    const page = Number(searchParams.get("page") ?? "1") || 1;
    const pageSize = Number(searchParams.get("pageSize") ?? "20") || 20;

    const result = await beerService.list(filters, { page, pageSize });
    return NextResponse.json(result);
  }
);

export const POST = withRateLimit(
  mutationRateLimiter,
  RouteGuard.requirePermission(
    MODULE_KEYS.BEERS,
    "add",
    async (request: NextRequest, _context, session) => {
      const body = await request.json();
      const parsed = BeerCreateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại các thông tin bắt buộc.", details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      const beer = await beerService.create(parsed.data, session.user.id);
      revalidatePath('/', 'layout');
      return NextResponse.json(beer, { status: 201 });
    }
  ),
  "beers-write"
);
