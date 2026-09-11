import { randomUUID } from "node:crypto";
import type {
  IStorageProvider,
  PresignedUpload,
  StoredObject,
} from "./IStorageProvider";
import { CloudinaryStorageProvider } from "./CloudinaryStorageProvider";

import {
  AllowedMediaContentType,
  isAllowedImageContentType,
  isAllowedMediaContentType,
  maxSizeBytesFor,
} from "./constants";

const EXTENSION_BY_CONTENT_TYPE: Record<AllowedMediaContentType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

/**
 * Domain-level wrapper around a storage provider: builds namespaced object
 * keys, enforces the media allowlist/size caps, and is what services/routes
 * import instead of touching the storage provider directly.
 */
export class StorageService {
  constructor(private readonly provider: IStorageProvider) {}

  buildMediaKey(namespace: string, contentType: AllowedMediaContentType): string {
    const ext = EXTENSION_BY_CONTENT_TYPE[contentType];
    const datePrefix = new Date().toISOString().slice(0, 10);
    return `${namespace}/${datePrefix}/${randomUUID()}.${ext}`;
  }

  /** @deprecated Use buildMediaKey — keys are built the same way for video. */
  buildImageKey(namespace: string, contentType: AllowedMediaContentType): string {
    return this.buildMediaKey(namespace, contentType);
  }

  /**
   * Presigns an upload for an image *or* a video. The size cap applied is
   * the one for the content type (see maxSizeBytesFor), so a video is not
   * silently held to the 5MB image ceiling.
   */
  async requestMediaUpload(
    namespace: string,
    contentType: string
  ): Promise<PresignedUpload> {
    if (!isAllowedMediaContentType(contentType)) {
      throw new Error(`Unsupported media content type: ${contentType}`);
    }
    const key = this.buildMediaKey(namespace, contentType);
    return this.provider.createPresignedUpload({
      key,
      contentType,
      maxSizeBytes: maxSizeBytesFor(contentType),
    });
  }

  /**
   * Image-only presign — the narrower gate for callers that must never
   * accept video (the Tiptap inline-image button, cover images, beer and
   * brand-story artwork). Only the hero section takes video today.
   */
  async requestImageUpload(
    namespace: string,
    contentType: string
  ): Promise<PresignedUpload> {
    if (!isAllowedImageContentType(contentType)) {
      throw new Error(`Unsupported image content type: ${contentType}`);
    }
    return this.requestMediaUpload(namespace, contentType);
  }

  async getViewUrl(key: string): Promise<string> {
    return this.provider.createViewUrl({ key });
  }

  async getObject(key: string): Promise<StoredObject | null> {
    return this.provider.getObject(key);
  }

  async deleteObject(key: string): Promise<void> {
    await this.provider.deleteObject(key);
  }
}

// Swapping providers later means changing only this line — see IStorageProvider.
export const storageService = new StorageService(new CloudinaryStorageProvider());
