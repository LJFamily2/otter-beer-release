import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { MODULE_KEYS, type ModuleKey, type ActionGrant } from "@/config/permissions";
import { permissionService, PermissionMutationError } from "@/services/PermissionService";
import { UpdatePermissionMatrixSchema } from "@/lib/validation/permission";
import { withRateLimit } from "@/lib/rate-limit/withRateLimit";
import { mutationRateLimiter } from "@/lib/rate-limit/limiters";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roleId = request.nextUrl.searchParams.get("roleId");
  const userId = request.nextUrl.searchParams.get("userId");

  if (roleId) {
    const grant = session.user.permissions?.[MODULE_KEYS.ROLES_PERMISSIONS];
    if (!grant?.view) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const matrix = await permissionService.getMatrixForRoleId(roleId);
    return NextResponse.json({ roleId, matrix });
  }

  if (userId) {
    const grant = session.user.permissions?.[MODULE_KEYS.USERS];
    if (!grant?.view) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const result = await permissionService.getMatrixForUser(userId);
    return NextResponse.json({ userId, matrix: result.matrix, isCustom: result.isCustom });
  }

  return NextResponse.json(
    { error: "roleId or userId query param is required" },
    { status: 400 }
  );
}

export const PUT = withRateLimit(
  mutationRateLimiter,
  async (request: NextRequest) => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = UpdatePermissionMatrixSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const grants = parsed.data.grants as {
      moduleKey: ModuleKey;
      actions: ActionGrant;
    }[];

    try {
      if (parsed.data.roleId) {
        const grant = session.user.permissions?.[MODULE_KEYS.ROLES_PERMISSIONS];
        if (!grant?.edit) {
          return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        const matrix = await permissionService.setMatrixForRole(
          parsed.data.roleId,
          grants,
          session.user.roleLevel
        );
        return NextResponse.json({ roleId: parsed.data.roleId, matrix });
      }

      if (parsed.data.userId) {
        const grant = session.user.permissions?.[MODULE_KEYS.USERS];
        if (!grant?.edit) {
          return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        const result = await permissionService.setMatrixForUser(
          parsed.data.userId,
          grants,
          session.user.roleLevel
        );
        return NextResponse.json({
          userId: parsed.data.userId,
          matrix: result.matrix,
          isCustom: result.isCustom,
        });
      }

      return NextResponse.json(
        { error: "roleId or userId is required" },
        { status: 400 }
      );
    } catch (err) {
      if (err instanceof PermissionMutationError) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      throw err;
    }
  },
  "permissions-write"
);

export const DELETE = withRateLimit(
  mutationRateLimiter,
  async (request: NextRequest) => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json(
        { error: "userId query param is required" },
        { status: 400 }
      );
    }

    const grant = session.user.permissions?.[MODULE_KEYS.USERS];
    if (!grant?.edit) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    try {
      const result = await permissionService.resetUserToRoleDefaults(
        userId,
        session.user.roleLevel
      );
      return NextResponse.json({
        userId,
        matrix: result.matrix,
        isCustom: result.isCustom,
      });
    } catch (err) {
      if (err instanceof PermissionMutationError) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      throw err;
    }
  },
  "permissions-write"
);
