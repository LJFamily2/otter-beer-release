import { NextResponse, type NextRequest } from "next/server";
import { RouteGuard } from "@/lib/auth/RouteGuard";
import { MODULE_KEYS } from "@/config/permissions";
import { roleService, RoleMutationError } from "@/services/RoleService";
import { CreateRoleSchema } from "@/lib/validation/role";
import { withRateLimit } from "@/lib/rate-limit/withRateLimit";
import { mutationRateLimiter } from "@/lib/rate-limit/limiters";

export const GET = RouteGuard.requirePermission(
  MODULE_KEYS.ROLES_PERMISSIONS,
  "view",
  async () => {
    const roles = await roleService.list();
    return NextResponse.json(roles);
  }
);

export const POST = withRateLimit(
  mutationRateLimiter,
  RouteGuard.requirePermission(
    MODULE_KEYS.ROLES_PERMISSIONS,
    "add",
    async (request: NextRequest, _context, session) => {
      const body = await request.json();
      const parsed = CreateRoleSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      try {
        const role = await roleService.create(
          parsed.data.key,
          parsed.data.name,
          session.user.roleLevel
        );
        return NextResponse.json(role, { status: 201 });
      } catch (err) {
        if (err instanceof RoleMutationError) {
          return NextResponse.json({ error: err.message }, { status: 409 });
        }
        throw err;
      }
    }
  ),
  "roles-write"
);
