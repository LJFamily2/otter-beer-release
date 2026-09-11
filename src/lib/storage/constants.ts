export const ALLOWED_IMAGE_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export type AllowedImageContentType =
  (typeof ALLOWED_IMAGE_CONTENT_TYPES)[number];

/**
 * Video is accepted only for the hero section today. The list is deliberately
 * short: MP4 (H.264) and WebM are the two formats every target browser can
 * play from a plain <video> tag with no transcoding step in between.
 */
export const ALLOWED_VIDEO_CONTENT_TYPES = [
  "video/mp4",
  "video/webm",
] as const;

export type AllowedVideoContentType =
  (typeof ALLOWED_VIDEO_CONTENT_TYPES)[number];

export type AllowedMediaContentType =
  | AllowedImageContentType
  | AllowedVideoContentType;

export const ALLOWED_MEDIA_CONTENT_TYPES = [
  ...ALLOWED_IMAGE_CONTENT_TYPES,
  ...ALLOWED_VIDEO_CONTENT_TYPES,
] as const;

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB, per docs/security.md

/**
 * Videos get their own, larger cap — a 5MB ceiling makes a hero clip of any
 * usable length impossible. Enforced the same way the image cap is: in the
 * presigned policy where the provider supports it (R2), and post-upload
 * against the bytes the provider reports otherwise (Cloudinary) — see
 * uploadMedia.ts.
 */
export const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

export function isAllowedImageContentType(
  value: string
): value is AllowedImageContentType {
  return (ALLOWED_IMAGE_CONTENT_TYPES as readonly string[]).includes(value);
}

export function isAllowedVideoContentType(
  value: string
): value is AllowedVideoContentType {
  return (ALLOWED_VIDEO_CONTENT_TYPES as readonly string[]).includes(value);
}

export function isAllowedMediaContentType(
  value: string
): value is AllowedMediaContentType {
  return isAllowedImageContentType(value) || isAllowedVideoContentType(value);
}

/** The size cap that applies to a given content type. */
export function maxSizeBytesFor(contentType: string): number {
  return isAllowedVideoContentType(contentType)
    ? MAX_VIDEO_SIZE_BYTES
    : MAX_IMAGE_SIZE_BYTES;
}

const VIDEO_EXTENSIONS = ["mp4", "webm"] as const;

/**
 * Whether a stored object key points at a video, judged by its extension.
 *
 * Keys are built by StorageService from the upload's content type and are
 * never renamed, so the extension is authoritative. Deriving it this way
 * (rather than threading a resource-type flag through IStorageProvider) is
 * what lets a provider that needs to know — Cloudinary routes image and
 * video through different endpoints — work it out from the key alone, on
 * every call, including ones that only ever receive a key (getObject,
 * deleteObject, createViewUrl).
 */
export function isVideoKey(key: string): boolean {
  const extension = key.split(".").pop()?.toLowerCase() ?? "";
  return (VIDEO_EXTENSIONS as readonly string[]).includes(extension);
}

/**
 * Public, cacheable URL for a media key that belongs to published content
 * (or is being previewed by an authenticated admin) — see
 * src/app/api/media/public/[...key]/route.ts. Kept in this dependency-free
 * file (not StorageService.ts) so importing it never pulls in the AWS SDK /
 * R2 client — src/lib/seo.ts and every page component that renders a post
 * image needs just this string builder, nothing else from the storage layer.
 */
export function publicMediaUrl(key: string): string {
  return `/api/media/public/${key}`;
}

/** @deprecated Use publicMediaUrl — the route serves video as well now. */
export function publicImageUrl(key: string): string {
  return publicMediaUrl(key);
}
