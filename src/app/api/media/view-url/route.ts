import { NextResponse, type NextRequest } from "next/server";
import { RouteGuard } from "@/lib/auth/RouteGuard";
import {
  MEDIA_NAMESPACES,
  MODULE_BY_MEDIA_NAMESPACE,
} from "@/lib/storage/namespaces";
import { storageService } from "@/lib/storage/StorageService";
import { RequestViewUrlSchema } from "@/lib/validation/media";

export const POST = RouteGuard.requireAuth(
  async (request: NextRequest, _context, session) => {
    // View access to any media-owning module is enough — the same reason
    // the public proxy route treats them alike: a key alone doesn't say
    // which module it belongs to, and every one of them can hold media.
    const canViewSomeMedia = MEDIA_NAMESPACES.some((namespace) =>
      Boolean(session.user.permissions?.[MODULE_BY_MEDIA_NAMESPACE[namespace]]?.view)
    );
    if (!canViewSomeMedia) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = RequestViewUrlSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const url = await storageService.getViewUrl(parsed.data.key);
    return NextResponse.json({ url });
  }
);
