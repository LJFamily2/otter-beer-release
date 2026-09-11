import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { RouteGuard } from "@/lib/auth/RouteGuard";
import { MODULE_KEYS } from "@/config/permissions";
import { beerService } from "@/services/BeerService";
import { BeerUpdateSchema } from "@/lib/validation/beer";
import { withRateLimit } from "@/lib/rate-limit/withRateLimit";
import { mutationRateLimiter } from "@/lib/rate-limit/limiters";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const GET = RouteGuard.requirePermission<RouteParams>(
  MODULE_KEYS.BEERS,
  "view",
  async (_request, context) => {
    const { id } = await context.params;
    const beer = await beerService.getById(id);
    if (!beer) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(beer);
  }
);

export const PATCH = withRateLimit(
  mutationRateLimiter,
  RouteGuard.requirePermission<RouteParams>(
    MODULE_KEYS.BEERS,
    "edit",
    async (request: NextRequest, context, session) => {
      const { id } = await context.params;
      const body = await request.json();
      const parsed = BeerUpdateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại các thông tin bắt buộc.", details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      const beer = await beerService.update(id, parsed.data, session.user.id);
      if (!beer) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      revalidatePath('/', 'layout');
      return NextResponse.json(beer);
    }
  ),
  "beers-write"
);

export const DELETE = withRateLimit(
  mutationRateLimiter,
  RouteGuard.requirePermission<RouteParams>(
    MODULE_KEYS.BEERS,
    "delete",
    async (_request, context) => {
      const { id } = await context.params;
      const deleted = await beerService.delete(id);
      if (!deleted) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      revalidatePath('/', 'layout');
      return new NextResponse(null, { status: 204 });
    }
  ),
  "beers-write"
);
