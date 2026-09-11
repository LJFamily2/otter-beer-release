import { createHash } from "node:crypto";
import { env } from "@/lib/env";
import { isVideoKey } from "./constants";
import type {
  CreateUploadRequest,
  CreateViewUrlRequest,
  IStorageProvider,
  PresignedUpload,
  StoredObject,
} from "./IStorageProvider";

const DEFAULT_UPLOAD_TTL_SECONDS = 5 * 60;

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  uploadPreset: string;
}

/**
 * Cloudinary (S3-incompatible, unlike R2) — the bucket-equivalent is
 * public, but the media/public route proxies every read through this app
 * rather than exposing res.cloudinary.com URLs to the browser (a direct
 * redirect was tried and broke next/image, see that route's docstring).
 * getObject() still fetches through createViewUrl()'s f_auto,q_auto
 * delivery URL, so the app's own server gets Cloudinary's format/quality
 * optimization on the origin fetch even though the browser no longer talks
 * to Cloudinary directly.
 *
 * Cloudinary's public_id must not include the file extension (it appends
 * the detected format itself at delivery), but StorageService's key format
 * is shared across providers and does include one — so every Cloudinary
 * call strips it via #toPublicId rather than changing the shared key format.
 */
export class CloudinaryStorageProvider implements IStorageProvider {
  private readonly config: CloudinaryConfig;

  constructor(config?: CloudinaryConfig) {
    this.config = config ?? {
      cloudName: env.CLOUDINARY_CLOUD_NAME,
      apiKey: env.CLOUDINARY_API_KEY,
      apiSecret: env.CLOUDINARY_API_SECRET,
      uploadPreset: env.CLOUDINARY_UPLOAD_PRESET,
    };
  }

  private toPublicId(key: string): string {
    return key.replace(/\.[^./]+$/, "");
  }

  /**
   * Cloudinary namespaces images and videos under different resource types,
   * and every endpoint path carries it — upload, delivery, and destroy all
   * 404 (or silently address the wrong object) if it is wrong. The key's
   * extension is what decides, see isVideoKey.
   */
  private toResourceType(key: string): "image" | "video" {
    return isVideoKey(key) ? "video" : "image";
  }

  private sign(params: Record<string, string>): string {
    const toSign = Object.keys(params)
      .sort()
      .map((name) => `${name}=${params[name]}`)
      .join("&");
    return createHash("sha1")
      .update(`${toSign}${this.config.apiSecret}`)
      .digest("hex");
  }

  async createPresignedUpload(
    request: CreateUploadRequest
  ): Promise<PresignedUpload> {
    const expiresInSeconds =
      request.expiresInSeconds ?? DEFAULT_UPLOAD_TTL_SECONDS;
    const timestamp = String(Math.floor(Date.now() / 1000));
    const publicId = this.toPublicId(request.key);

    // Format is enforced server-side because upload_preset (with its
    // dashboard-configured allowed_formats) is itself part of the signed
    // payload. Unlike R2's presigned-POST Conditions, Cloudinary has no
    // preset-level max file size — that's enforced after the fact, see
    // uploadImage.ts's post-upload bytes check.
    const signedParams = {
      public_id: publicId,
      timestamp,
      upload_preset: this.config.uploadPreset,
    };

    return {
      key: request.key,
      url: `https://api.cloudinary.com/v1_1/${this.config.cloudName}/${this.toResourceType(
        request.key
      )}/upload`,
      fields: {
        api_key: this.config.apiKey,
        ...signedParams,
        signature: this.sign(signedParams),
      },
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
    };
  }

  async createViewUrl(request: CreateViewUrlRequest): Promise<string> {
    const publicId = this.toPublicId(request.key);
    const resourceType = this.toResourceType(request.key);
    return `https://res.cloudinary.com/${this.config.cloudName}/${resourceType}/upload/f_auto,q_auto/${publicId}`;
  }

  async getObject(key: string): Promise<StoredObject | null> {
    const url = await this.createViewUrl({ key });
    const response = await fetch(url);
    if (!response.ok) return null;
    return {
      body: new Uint8Array(await response.arrayBuffer()),
      contentType: response.headers.get("content-type") ?? "application/octet-stream",
    };
  }

  async deleteObject(key: string): Promise<void> {
    const publicId = this.toPublicId(key);
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signedParams = { public_id: publicId, timestamp };

    await fetch(
      `https://api.cloudinary.com/v1_1/${this.config.cloudName}/${this.toResourceType(
        key
      )}/destroy`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          ...signedParams,
          api_key: this.config.apiKey,
          signature: this.sign(signedParams),
        }),
      }
    );
  }
}
