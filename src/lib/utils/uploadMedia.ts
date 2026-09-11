import {
  ALLOWED_IMAGE_CONTENT_TYPES,
  ALLOWED_MEDIA_CONTENT_TYPES,
  isAllowedVideoContentType,
  maxSizeBytesFor,
  MAX_IMAGE_SIZE_BYTES,
  MAX_VIDEO_SIZE_BYTES,
  publicMediaUrl,
} from "@/lib/storage/constants";
import type { MediaNamespace } from "@/lib/storage/namespaces";

export interface UploadedMedia {
  key: string;
  /** Ready to use as an <img>/<video> src immediately — see the media/public route's admin-preview gate. */
  url: string;
  /** Which element the caller should render it in. */
  mediaType: "image" | "video";
}

export class MediaUploadError extends Error {}

export interface UploadMediaOptions {
  /** Storage folder + permission scope for the upload; defaults to news-blog. */
  namespace?: MediaNamespace;
  /** Whether video is acceptable. Defaults to false — only the hero takes video. */
  allowVideo?: boolean;
}

function megabytes(bytes: number): number {
  return Math.round(bytes / (1024 * 1024));
}

async function purgeOversizedUpload(key: string): Promise<void> {
  await fetch("/api/media/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key }),
  });
}

/**
 * Client-side upload flow: ask the server for a signed upload, upload
 * directly to Cloudinary, then return the object key + its (already-
 * viewable, even pre-publish) public proxy URL. Used by the cover image
 * field, the Tiptap inline image button, and the hero slide media field —
 * the last of which is the only caller that passes allowVideo.
 *
 * Cloudinary has no server-side way to reject an oversized file before
 * storing it (unlike R2's presigned-POST content-length-range condition —
 * see docs/security.md), so the client-side check below is a UX
 * short-circuit only. The real enforcement is the `bytes` Cloudinary
 * reports back in its own upload response: if that exceeds the cap, the
 * object is purged immediately via /api/media/delete before this ever
 * returns a usable key.
 */
export async function uploadMedia(
  file: File,
  options: UploadMediaOptions = {}
): Promise<UploadedMedia> {
  const { namespace = "news-blog", allowVideo = false } = options;

  const acceptedTypes = allowVideo
    ? ALLOWED_MEDIA_CONTENT_TYPES
    : ALLOWED_IMAGE_CONTENT_TYPES;

  if (!(acceptedTypes as readonly string[]).includes(file.type)) {
    throw new MediaUploadError(
      allowVideo
        ? "Chỉ chấp nhận ảnh JPEG, PNG, WebP, GIF hoặc video MP4, WebM."
        : "Chỉ chấp nhận ảnh JPEG, PNG, WebP, hoặc GIF."
    );
  }

  const isVideo = isAllowedVideoContentType(file.type);
  const maxSizeBytes = maxSizeBytesFor(file.type);
  const overSizeMessage = `Kích thước ${isVideo ? "video" : "ảnh"} tối đa là ${megabytes(
    isVideo ? MAX_VIDEO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES
  )}MB.`;

  if (file.size > maxSizeBytes) {
    throw new MediaUploadError(overSizeMessage);
  }

  const presignResponse = await fetch("/api/media/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentType: file.type, namespace }),
  });
  if (!presignResponse.ok) {
    throw new MediaUploadError("Không thể chuẩn bị tải tệp lên.");
  }
  const presigned = (await presignResponse.json()) as {
    key: string;
    url: string;
    fields: Record<string, string>;
  };

  const formData = new FormData();
  for (const [field, value] of Object.entries(presigned.fields)) {
    formData.append(field, value);
  }
  formData.append("file", file);

  let uploadResponse: Response;
  try {
    uploadResponse = await fetch(presigned.url, {
      method: "POST",
      body: formData,
    });
  } catch {
    throw new MediaUploadError("Kết nối mạng bị gián đoạn. Vui lòng kiểm tra lại mạng hoặc tắt trình chặn quảng cáo rồi thử lại.");
  }

  if (!uploadResponse.ok) {
    throw new MediaUploadError("Tải tệp lên thất bại.");
  }

  // Not every provider's upload response is JSON with a `bytes` field (R2's
  // presigned-POST success response is an empty 204) — providers that
  // already reject oversized files at the storage layer itself (R2) need
  // no follow-up check, so a parse failure here just means "nothing to
  // verify," not an error.
  let uploadedBytes: number | undefined;
  try {
    const body = (await uploadResponse.json()) as { bytes?: number };
    uploadedBytes = typeof body.bytes === "number" ? body.bytes : undefined;
  } catch {
    uploadedBytes = undefined;
  }
  if (uploadedBytes !== undefined && uploadedBytes > maxSizeBytes) {
    await purgeOversizedUpload(presigned.key);
    throw new MediaUploadError(overSizeMessage);
  }

  return {
    key: presigned.key,
    url: publicMediaUrl(presigned.key),
    mediaType: isVideo ? "video" : "image",
  };
}
