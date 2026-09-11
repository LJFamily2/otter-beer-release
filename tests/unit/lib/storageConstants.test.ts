import {
  ALLOWED_IMAGE_CONTENT_TYPES,
  ALLOWED_MEDIA_CONTENT_TYPES,
  ALLOWED_VIDEO_CONTENT_TYPES,
  isAllowedImageContentType,
  isAllowedMediaContentType,
  isAllowedVideoContentType,
  isVideoKey,
  maxSizeBytesFor,
  MAX_IMAGE_SIZE_BYTES,
  MAX_VIDEO_SIZE_BYTES,
  publicImageUrl,
  publicMediaUrl,
} from "@/lib/storage/constants";

describe("content type allowlists", () => {
  it("keeps the image allowlist unchanged by the addition of video", () => {
    expect(ALLOWED_IMAGE_CONTENT_TYPES).toEqual([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ]);
  });

  it("allows only the two browser-playable video containers", () => {
    expect(ALLOWED_VIDEO_CONTENT_TYPES).toEqual(["video/mp4", "video/webm"]);
  });

  it("composes the media allowlist from both halves", () => {
    expect(ALLOWED_MEDIA_CONTENT_TYPES).toEqual([
      ...ALLOWED_IMAGE_CONTENT_TYPES,
      ...ALLOWED_VIDEO_CONTENT_TYPES,
    ]);
  });

  it("does not classify a video type as an image type", () => {
    expect(isAllowedImageContentType("video/mp4")).toBe(false);
    expect(isAllowedVideoContentType("image/png")).toBe(false);
  });

  it("accepts either half as media", () => {
    expect(isAllowedMediaContentType("image/png")).toBe(true);
    expect(isAllowedMediaContentType("video/webm")).toBe(true);
  });

  it("rejects anything outside both lists", () => {
    expect(isAllowedMediaContentType("application/octet-stream")).toBe(false);
    expect(isAllowedMediaContentType("video/quicktime")).toBe(false);
    expect(isAllowedMediaContentType("")).toBe(false);
  });
});

describe("maxSizeBytesFor", () => {
  it("gives video its own, larger cap", () => {
    expect(maxSizeBytesFor("video/mp4")).toBe(MAX_VIDEO_SIZE_BYTES);
    expect(MAX_VIDEO_SIZE_BYTES).toBeGreaterThan(MAX_IMAGE_SIZE_BYTES);
  });

  it("holds images to the image cap", () => {
    expect(maxSizeBytesFor("image/jpeg")).toBe(MAX_IMAGE_SIZE_BYTES);
  });

  it("falls back to the (stricter) image cap for an unknown type", () => {
    expect(maxSizeBytesFor("application/pdf")).toBe(MAX_IMAGE_SIZE_BYTES);
  });
});

describe("isVideoKey", () => {
  it("recognises video keys by extension", () => {
    expect(isVideoKey("hero/2026-08-25/uuid.mp4")).toBe(true);
    expect(isVideoKey("hero/2026-08-25/uuid.webm")).toBe(true);
  });

  it("is case-insensitive about the extension", () => {
    expect(isVideoKey("hero/2026-08-25/uuid.MP4")).toBe(true);
  });

  it("treats image keys as non-video", () => {
    expect(isVideoKey("news-blog/2026-08-25/uuid.jpg")).toBe(false);
    expect(isVideoKey("hero/2026-08-25/uuid.webp")).toBe(false);
  });

  it("treats an extensionless key as non-video rather than throwing", () => {
    expect(isVideoKey("hero/2026-08-25/uuid")).toBe(false);
    expect(isVideoKey("")).toBe(false);
  });

  it("is not fooled by a video word inside the path", () => {
    expect(isVideoKey("hero/mp4/uuid.png")).toBe(false);
  });
});

describe("public URL builders", () => {
  it("routes a key through the app's own media proxy", () => {
    expect(publicMediaUrl("hero/a/b.mp4")).toBe("/api/media/public/hero/a/b.mp4");
  });

  it("keeps publicImageUrl working for existing callers", () => {
    expect(publicImageUrl("news-blog/a/b.jpg")).toBe(publicMediaUrl("news-blog/a/b.jpg"));
  });
});
