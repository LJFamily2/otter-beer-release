"use client";

import { useRef, useState } from "react";
import { uploadMedia } from "@/lib/utils/uploadMedia";
import { measureMediaDimensions } from "@/lib/utils/measureMedia";
import {
  ALLOWED_IMAGE_CONTENT_TYPES,
  ALLOWED_MEDIA_CONTENT_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_VIDEO_SIZE_BYTES,
  publicMediaUrl,
} from "@/lib/storage/constants";
import type { MediaNamespace } from "@/lib/storage/namespaces";
import { formatAspectRatio, isHeroAspectRatio } from "@/config/heroSlide";
import { buttonVariants } from "@/components/ui/Button";

export type MediaKind = "image" | "video";

interface MediaUploadFieldProps {
  mediaKey?: string;
  mediaType?: MediaKind;
  onChange: (value: { key: string; mediaType: MediaKind } | undefined) => void;
  /** Storage folder + permission scope — see src/lib/storage/namespaces.ts. */
  namespace: MediaNamespace;
  /** Whether video files may be picked. Only the hero section passes true. */
  allowVideo?: boolean;
  /**
   * Warn (never block) when the picked file isn't 16:9. Off by default so
   * this field stays usable for surfaces with no fixed aspect ratio.
   */
  warnOnNon16x9?: boolean;
  /** The aspect ratio for the preview container. Default is "16/9". */
  aspectRatio?: "16/9" | "9/16";
}

function megabytes(bytes: number): number {
  return Math.round(bytes / (1024 * 1024));
}

/**
 * Media picker for surfaces that accept an image *or* a video, with a 16:9
 * preview stage and an advisory aspect-ratio warning.
 *
 * Deliberately a sibling of ImageUploadField rather than a variant of it:
 * that field is image-only with a square thumbnail and is used by three
 * forms whose behavior must not change, while this one previews video,
 * carries a second size cap, and reports a mediaType back to its caller.
 */
export function MediaUploadField({
  mediaKey,
  mediaType = "image",
  onChange,
  namespace,
  allowVideo = false,
  warnOnNon16x9 = false,
  aspectRatio = "16/9",
}: MediaUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ratioWarning, setRatioWarning] = useState<string | null>(null);

  const acceptedTypes = allowVideo
    ? ALLOWED_MEDIA_CONTENT_TYPES
    : ALLOWED_IMAGE_CONTENT_TYPES;

  async function handlePick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    setRatioWarning(null);
    setIsUploading(true);
    try {
      if (warnOnNon16x9) {
        // Advisory only — an off-ratio file still uploads, it just gets
        // cropped by the 16:9 hero stage, and the editor is told so.
        const dimensions = await measureMediaDimensions(file);
        if (dimensions && !isHeroAspectRatio(dimensions.width, dimensions.height)) {
          setRatioWarning(
            `Tệp này có tỉ lệ ${formatAspectRatio(dimensions.width, dimensions.height)} ` +
              `(${dimensions.width}×${dimensions.height}), không phải 16:9 — ảnh sẽ bị cắt khi hiển thị trên trang chủ.`
          );
        }
      }

      const uploaded = await uploadMedia(file, { namespace, allowVideo });
      onChange({ key: uploaded.key, mediaType: uploaded.mediaType });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tải tệp thất bại.");
    } finally {
      setIsUploading(false);
    }
  }

  function handleRemove() {
    setError(null);
    setRatioWarning(null);
    onChange(undefined);
  }

  const hintText = allowVideo
    ? `Ảnh JPEG, PNG, WebP, GIF (tối đa ${megabytes(MAX_IMAGE_SIZE_BYTES)}MB) hoặc video MP4, WebM (tối đa ${megabytes(MAX_VIDEO_SIZE_BYTES)}MB)${warnOnNon16x9 ? " — khuyến nghị tỉ lệ 16:9, VD 1920×1080" : ""}`
    : `JPEG, PNG, WebP, hoặc GIF — tối đa ${megabytes(MAX_IMAGE_SIZE_BYTES)}MB`;

  return (
    <div className="flex h-full flex-col gap-1.5">
      <div className="flex h-full flex-col items-center justify-start gap-4 rounded border border-dashed border-[rgba(196,198,210,0.7)] bg-surface p-4">
        <div
          data-testid="media-preview"
          className={`flex items-center justify-center overflow-hidden rounded bg-surface-container-high ${
            aspectRatio === "9/16" ? "w-full max-w-[140px] sm:max-w-[160px] aspect-[9/16]" : "w-full aspect-video"
          }`}
        >
          {mediaKey ? (
            mediaType === "video" ? (
              <video
                data-testid="media-preview-video"
                src={publicMediaUrl(mediaKey)}
                className="h-full w-full object-cover"
                controls
                muted
                playsInline
                preload="metadata"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- served by our own proxy route, arbitrary storage key, next/image optimization not applicable
              <img
                data-testid="media-preview-image"
                src={publicMediaUrl(mediaKey)}
                alt=""
                className="h-full w-full object-cover"
              />
            )
          ) : (
            <span className="px-2 text-center text-xs text-on-surface-variant">
              {allowVideo ? "Chưa có ảnh/video" : "Chưa có ảnh"}
            </span>
          )}
        </div>
        <div className="flex w-full flex-col items-center gap-2">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              className={buttonVariants("secondary")}
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading
                ? "Đang tải..."
                : mediaKey
                  ? "Thay tệp"
                  : allowVideo
                    ? "Tải ảnh/video lên"
                    : "Tải ảnh lên"}
            </button>
            {mediaKey ? (
              <button
                type="button"
                className="cursor-pointer border-none bg-transparent p-0 text-[13px] text-error hover:underline"
                onClick={handleRemove}
              >
                Xóa tệp
              </button>
            ) : null}
          </div>
          <span className="text-center text-xs text-on-surface-variant">{hintText}</span>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={acceptedTypes.join(",")}
          hidden
          onChange={handlePick}
        />
      </div>
      {error ? <p className="text-xs font-medium text-error">{error}</p> : null}
      {ratioWarning ? (
        <p role="status" className="text-xs font-medium text-[#b45309]">
          {ratioWarning}
        </p>
      ) : null}
    </div>
  );
}
