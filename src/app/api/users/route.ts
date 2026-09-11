import { NextResponse, type NextRequest } from "next/server";
import { RouteGuard } from "@/lib/auth/RouteGuard";
import { MODULE_KEYS } from "@/config/permissions";
import { userService, UserMutationError } from "@/services/UserService";
import { InviteUserSchema } from "@/lib/validation/user";
import { withRateLimit } from "@/lib/rate-limit/withRateLimit";
import { mutationRateLimiter } from "@/lib/rate-limit/limiters";

export const GET = RouteGuard.requirePermission(
  MODULE_KEYS.USERS,
  "view",
  async () => {
    const users = await userService.list();
    return NextResponse.json(users);
  }
);

export const POST = withRateLimit(
  mutationRateLimiter,
  RouteGuard.requirePermission(
    MODULE_KEYS.USERS,
    "add",
    async (request: NextRequest, _context, session) => {
      const body = await request.json();
      const parsed = InviteUserSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      try {
        const user = await userService.invite(
          parsed.data.email,
          parsed.data.name,
          parsed.data.roleId,
          session.user.roleLevel
        );
        return NextResponse.json(user, { status: 201 });
      } catch (err) {
        if (err instanceof UserMutationError) {
          const status = err.message.includes("already has access")
            ? 409
            : 404;
          return NextResponse.json({ error: "Not found" }, { status });
        }
        throw err;
      }
    }
  ),
  "users-write"
);
