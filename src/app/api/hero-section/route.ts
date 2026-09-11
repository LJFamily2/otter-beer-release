import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { RouteGuard } from "@/lib/auth/RouteGuard";
import { MODULE_KEYS } from "@/config/permissions";
import { heroSectionService } from "@/services/HeroSectionService";
import { HeroSectionUpdateSchema } from "@/lib/validation/heroSection";
import { withRateLimit } from "@/lib/rate-limit/withRateLimit";
import { mutationRateLimiter } from "@/lib/rate-limit/limiters";

/**
 * Singleton resource — no [id] segment, exactly like /api/brand-story. GET
 * returns the one Hero Section document's slides (empty array if never
 * saved); PUT replaces the whole slides array in one call, which is also
 * how reordering is persisted.
 */
export const GET = RouteGuard.requirePermission(
  MODULE_KEYS.HERO_SECTION,
  "view",
  async () => {
    const heroSection = await heroSectionService.get();
    return NextResponse.json({ slides: heroSection?.slides ?? [] });
  }
);

export const PUT = withRateLimit(
  mutationRateLimiter,
  RouteGuard.requirePermission(
    MODULE_KEYS.HERO_SECTION,
    "edit",
    async (request: NextRequest, _context, session) => {
      const body = await request.json();
      const parsed = HeroSectionUpdateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại các thông tin bắt buộc.", details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      const heroSection = await heroSectionService.replaceSlides(
        parsed.data,
        session.user.id
      );
      revalidatePath('/', 'layout');
      return NextResponse.json({ slides: heroSection.slides });
    }
  ),
  "hero-section-write"
);
