import { NextResponse, type NextRequest } from "next/server";
import type { RateLimiter } from "./RateLimiter";
import { getClientIp } from "./getClientIp";

type Handler<Ctx> = (
  request: NextRequest,
  context: Ctx
) => Promise<Response> | Response;

/**
 * Wraps a route handler (or a RouteGuard-wrapped one) with a per-IP rate
 * limit. Put it on the outside of the composition so abusive requests are
 * rejected before any auth/DB work runs:
 *
 *   export const POST = withRateLimit(
 *     uploadRateLimiter,
 *     RouteGuard.requireAuth(handler)
 *   );
 */
export function withRateLimit<Ctx>(
  limiter: RateLimiter,
  handler: Handler<Ctx>,
  keyPrefix: string
): Handler<Ctx> {
  return async (request, context) => {
    const key = `${keyPrefix}:${getClientIp(request)}`;
    const result = limiter.check(key);

    if (!result.success) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((result.resetAt - Date.now()) / 1000)
      );
      return NextResponse.json(
        { error: "Quá nhiều yêu cầu. Vui lòng thử lại sau." },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfterSeconds) },
        }
      );
    }

    return handler(request, context);
  };
}
