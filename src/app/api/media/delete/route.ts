import { NextResponse, type NextRequest } from "next/server";
import { RouteGuard } from "@/lib/auth/RouteGuard";
import {
  MEDIA_NAMESPACES,
  MODULE_BY_MEDIA_NAMESPACE,
} from "@/lib/storage/namespaces";
import { storageService } from "@/lib/storage/StorageService";
import { RequestDeleteSchema } from "@/lib/validation/media";
import { withRateLimit } from "@/lib/rate-limit/withRateLimit";
import { uploadRateLimiter } from "@/lib/rate-limit/limiters";

/**
 * Only caller today is uploadMedia.ts's post-upload size check: Cloudinary
 * (unlike R2's presigned-POST content-length-range condition) has no way to
 * reject an oversized file before it's stored, so the client uploads, reads
 * the actual `bytes` Cloudinary reports back, and calls this to purge it if
 * it's over the cap — see docs/security.md's File Upload Security section.
 * Gated/rate-limited the same as issuing the upload in the first place —
 * which, since the namespace fix, means "add or edit on any module that can
 * upload media" rather than news_blog alone. The key being purged was just
 * minted by this same session's presign call and is not yet referenced by
 * any document, so there is nothing narrower to scope the check to.
 */
export const POST = withRateLimit(
  uploadRateLimiter,
  RouteGuard.requireAuth(async (request: NextRequest, _context, session) => {
    const canUploadSomewhere = MEDIA_NAMESPACES.some((namespace) => {
      const grant = session.user.permissions?.[MODULE_BY_MEDIA_NAMESPACE[namespace]];
      return Boolean(grant?.add || grant?.edit);
    });
    if (!canUploadSomewhere) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = RequestDeleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await storageService.deleteObject(parsed.data.key);
    return NextResponse.json({ ok: true });
  }),
  "media-delete"
);
