export interface PresignedUpload {
  /** The R2 object key the client must PUT/POST the file to. */
  key: string;
  /** URL the browser posts the file to. */
  url: string;
  /** Extra form fields required by the presigned POST policy (order matters). */
  fields: Record<string, string>;
  expiresAt: Date;
}

export interface CreateUploadRequest {
  key: string;
  contentType: string;
  maxSizeBytes: number;
  expiresInSeconds?: number;
}

export interface CreateViewUrlRequest {
  key: string;
  expiresInSeconds?: number;
}

export interface StoredObject {
  body: Uint8Array;
  contentType: string;
}

/**
 * Storage is behind this interface so swapping providers later (or adding a
 * second one, e.g. local disk for tests) only means writing a new class —
 * nothing above the interface changes.
 */
export interface IStorageProvider {
  createPresignedUpload(request: CreateUploadRequest): Promise<PresignedUpload>;
  createViewUrl(request: CreateViewUrlRequest): Promise<string>;
  /** Fetches an object's bytes directly — used by the public image proxy route. */
  getObject(key: string): Promise<StoredObject | null>;
  deleteObject(key: string): Promise<void>;
}
