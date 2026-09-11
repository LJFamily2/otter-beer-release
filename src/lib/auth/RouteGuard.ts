import { NextResponse, type NextRequest } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import type { ModuleKey, PermissionAction } from "@/config/permissions";

type RouteHandler<Ctx> = (
  request: NextRequest,
  context: Ctx,
  session: Session
) => Promise<Response> | Response;

/**
 * Wraps API Route Handlers with the auth/permission check every mutation
 * needs. Session role alone is never trusted for writes — this always
 * re-checks the live permission matrix per docs/security.md's rule to
 * "verify role on EVERY write operation."
 */
export class RouteGuard {
  static requireAuth<Ctx>(handler: RouteHandler<Ctx>) {
    return async (request: NextRequest, context: Ctx) => {
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return handler(request, context, session);
    };
  }

  static requirePermission<Ctx>(
    moduleKey: ModuleKey,
    action: PermissionAction,
    handler: RouteHandler<Ctx>
  ) {
    return async (request: NextRequest, context: Ctx) => {
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const grant = session.user.permissions?.[moduleKey];
      if (!grant?.[action]) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return handler(request, context, session);
    };
  }
}
