import { NextResponse, type NextRequest } from "next/server";
import { RouteGuard } from "@/lib/auth/RouteGuard";
import { MODULE_KEYS } from "@/config/permissions";
import { userService, UserMutationError } from "@/services/UserService";
import { UpdateUserSchema } from "@/lib/validation/user";
import { withRateLimit } from "@/lib/rate-limit/withRateLimit";
import { mutationRateLimiter } from "@/lib/rate-limit/limiters";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const PATCH = withRateLimit(
  mutationRateLimiter,
  RouteGuard.requirePermission<RouteParams>(
    MODULE_KEYS.USERS,
    "edit",
    async (request: NextRequest, context, session) => {
      const { id } = await context.params;

      if (id === session.user.id) {
        return NextResponse.json(
          { error: "You cannot change your own role or access." },
          { status: 400 }
        );
      }

      const body = await request.json();
      const parsed = UpdateUserSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      try {
        let user = null;
        if (parsed.data.roleId !== undefined) {
          user = await userService.updateRole(
            id,
            parsed.data.roleId,
            session.user.roleLevel
          );
        }
        if (parsed.data.isActive !== undefined) {
          user = await userService.setActive(
            id,
            parsed.data.isActive,
            session.user.roleLevel
          );
        }
        if (!user) {
          return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        return NextResponse.json(user);
      } catch (err) {
        if (err instanceof UserMutationError) {
          return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        throw err;
      }
    }
  ),
  "users-write"
);

export const DELETE = withRateLimit(
  mutationRateLimiter,
  RouteGuard.requirePermission<RouteParams>(
    MODULE_KEYS.USERS,
    "delete",
    async (_request, context, session) => {
      const { id } = await context.params;

      if (id === session.user.id) {
        return NextResponse.json(
          { error: "You cannot remove your own access." },
          { status: 400 }
        );
      }

      try {
        const deleted = await userService.delete(id, session.user.roleLevel);
        if (!deleted) {
          return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        return new NextResponse(null, { status: 204 });
      } catch (err) {
        if (err instanceof UserMutationError) {
          return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        throw err;
      }
    }
  ),
  "users-write"
);
