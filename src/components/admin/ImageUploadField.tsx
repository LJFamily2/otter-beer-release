"use client";

import { useRef, useState } from "react";
import { uploadImage } from "@/lib/utils/uploadImage";
import { publicMediaUrl } from "@/lib/storage/constants";
import type { MediaNamespace } from "@/lib/storage/namespaces";
import { buttonVariants } from "@/components/ui/Button";

interface ImageUploadFieldProps {
  imageKey?: string;
  onChange: (key: string | undefined) => void;
  /**
   * Storage folder the upload lands in, and the module whose permission
   * grant authorizes it — see src/lib/storage/namespaces.ts. Defaults to
   * news-blog, which is where every upload used to go regardless of the
   * form it came from.
   */
  namespace?: MediaNamespace;
}

export function ImageUploadField({
  imageKey,
  onChange,
  namespace = "news-blog",
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    setIsUploading(true);
    try {
      const uploaded = await uploadImage(file, { namespace });
      onChange(uploaded.key);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tải ảnh thất bại.");
    } finally {
      setIsUploading(false);
    }
  }

  function handleRemove() {
    setError(null);
    onChange(undefined);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-4 rounded border border-dashed border-[rgba(196,198,210,0.7)] bg-surface p-4">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded bg-surface-container-high">
          {imageKey ? (
            // eslint-disable-next-line @next/next/no-img-element -- served by our own proxy route, arbitrary R2 key, next/image optimization not applicable
            <img
              src={publicMediaUrl(imageKey)}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="px-2 text-center text-xs text-on-surface-variant">
              Chưa có ảnh
            </span>
          )}
        </div>
        <div className="flex flex-col items-start gap-2">
          <button
            type="button"
            className={buttonVariants("secondary")}
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? "Đang tải..." : imageKey ? "Thay ảnh" : "Tải ảnh lên"}
          </button>
          {imageKey ? (
            <button
              type="button"
              className="cursor-pointer border-none bg-transparent p-0 text-[13px] text-error hover:underline"
              onClick={handleRemove}
            >
              Xóa ảnh
            </button>
          ) : null}
          <span className="text-xs text-on-surface-variant">
            JPEG, PNG, WebP, hoặc GIF — tối đa 5MB
          </span>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          hidden
          onChange={handlePick}
        />
      </div>
      {error ? (
        <p className="text-xs font-medium text-error">{error}</p>
      ) : null}
    </div>
  );
}
