import { NextResponse, type NextRequest } from "next/server";
import { RouteGuard } from "@/lib/auth/RouteGuard";
import { storageService } from "@/lib/storage/StorageService";
import { RequestUploadSchema } from "@/lib/validation/media";
import {
  allowsVideo,
  MODULE_BY_MEDIA_NAMESPACE,
} from "@/lib/storage/namespaces";
import { isAllowedVideoContentType } from "@/lib/storage/constants";
import { withRateLimit } from "@/lib/rate-limit/withRateLimit";
import { uploadRateLimiter } from "@/lib/rate-limit/limiters";

/**
 * Media uploads are shared by every content-editing flow, so the grant
 * checked is the one for the namespace being written to — a beer photo is
 * authorized against `beers`, a hero slide against `hero_section`, and so on
 * (see src/lib/storage/namespaces.ts). "add" or "edit" on that module is
 * enough; either one implies the editor is allowed to attach media to it.
 */
export const POST = withRateLimit(
  uploadRateLimiter,
  RouteGuard.requireAuth(async (request: NextRequest, _context, session) => {
    const body = await request.json();
    const parsed = RequestUploadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { namespace, contentType } = parsed.data;

    const grant = session.user.permissions?.[MODULE_BY_MEDIA_NAMESPACE[namespace]];
    if (!grant?.add && !grant?.edit) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Video is hero-only; anywhere else it would be stored and then never
    // rendered, since those surfaces use <img>/next/image.
    if (isAllowedVideoContentType(contentType) && !allowsVideo(namespace)) {
      return NextResponse.json(
        { error: "Không hỗ trợ tải video cho mục này." },
        { status: 400 }
      );
    }

    const upload = await storageService.requestMediaUpload(
      namespace,
      contentType
    );
    return NextResponse.json(upload);
  }),
  "media-upload-url"
);
