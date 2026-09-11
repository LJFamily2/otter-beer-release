import { uploadMedia, MediaUploadError, type UploadMediaOptions } from "./uploadMedia";

export interface UploadedImage {
  key: string;
  /** Ready to use as an <img src> immediately — see the media/public route's admin-preview gate. */
  url: string;
}

/**
 * @deprecated Prefer MediaUploadError — kept as an alias so existing
 * `instanceof` checks in callers and tests keep working after the
 * image-only upload path became the narrow case of uploadMedia.
 */
export const ImageUploadError = MediaUploadError;

/**
 * Image-only upload — the narrow wrapper over uploadMedia for every caller
 * that must not accept video (cover images, Tiptap inline images, beer and
 * brand-story artwork). Only the hero section calls uploadMedia directly.
 */
export async function uploadImage(
  file: File,
  options: Omit<UploadMediaOptions, "allowVideo"> = {}
): Promise<UploadedImage> {
  const { key, url } = await uploadMedia(file, { ...options, allowVideo: false });
  return { key, url };
}
