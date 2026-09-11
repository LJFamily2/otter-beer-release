import { uploadMedia, MediaUploadError } from "@/lib/utils/uploadMedia";
import {
  MAX_IMAGE_SIZE_BYTES,
  MAX_VIDEO_SIZE_BYTES,
} from "@/lib/storage/constants";

function fileOf(size: number, name: string, type: string) {
  return new File([new Uint8Array(size)], name, { type });
}

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body };
}

function presignResponse(key: string) {
  return jsonResponse({
    key,
    url: "https://api.cloudinary.com/v1_1/otterbeer-test/video/upload",
    fields: { api_key: "x", timestamp: "1", public_id: "p", signature: "s" },
  });
}

describe("uploadMedia", () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("rejects a video when the caller did not opt into video", async () => {
    const file = fileOf(100, "clip.mp4", "video/mp4");

    await expect(uploadMedia(file)).rejects.toThrow(MediaUploadError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts a video when allowVideo is set", async () => {
    fetchMock
      .mockResolvedValueOnce(presignResponse("hero/2026-08-25/uuid.mp4"))
      .mockResolvedValueOnce(jsonResponse({ bytes: 100 }));

    const result = await uploadMedia(fileOf(100, "clip.mp4", "video/mp4"), {
      namespace: "hero",
      allowVideo: true,
    });

    expect(result).toEqual({
      key: "hero/2026-08-25/uuid.mp4",
      url: "/api/media/public/hero/2026-08-25/uuid.mp4",
      mediaType: "video",
    });
  });

  it("reports images as mediaType image", async () => {
    fetchMock
      .mockResolvedValueOnce(presignResponse("hero/2026-08-25/uuid.jpg"))
      .mockResolvedValueOnce(jsonResponse({ bytes: 100 }));

    const result = await uploadMedia(fileOf(100, "shot.jpg", "image/jpeg"), {
      namespace: "hero",
      allowVideo: true,
    });

    expect(result.mediaType).toBe("image");
  });

  it("sends the namespace with the presign request", async () => {
    fetchMock
      .mockResolvedValueOnce(presignResponse("beers/2026-08-25/uuid.jpg"))
      .mockResolvedValueOnce(jsonResponse({ bytes: 100 }));

    await uploadMedia(fileOf(100, "beer.jpg", "image/jpeg"), { namespace: "beers" });

    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({
      contentType: "image/jpeg",
      namespace: "beers",
    });
  });

  it("defaults to the news-blog namespace when none is given", async () => {
    fetchMock
      .mockResolvedValueOnce(presignResponse("news-blog/2026-08-25/uuid.jpg"))
      .mockResolvedValueOnce(jsonResponse({ bytes: 100 }));

    await uploadMedia(fileOf(100, "cover.jpg", "image/jpeg"));

    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body).namespace).toBe("news-blog");
  });

  it("holds a video to the video cap, not the image cap", async () => {
    // Comfortably over the 5MB image ceiling but under the video one — this
    // is the case that used to be rejected before video had its own cap.
    const size = MAX_IMAGE_SIZE_BYTES + 1024;
    fetchMock
      .mockResolvedValueOnce(presignResponse("hero/2026-08-25/uuid.mp4"))
      .mockResolvedValueOnce(jsonResponse({ bytes: size }));

    const result = await uploadMedia(fileOf(size, "clip.mp4", "video/mp4"), {
      namespace: "hero",
      allowVideo: true,
    });

    expect(result.mediaType).toBe("video");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("rejects a video over the video cap before any network call", async () => {
    const file = fileOf(MAX_VIDEO_SIZE_BYTES + 1, "huge.mp4", "video/mp4");

    await expect(
      uploadMedia(file, { namespace: "hero", allowVideo: true })
    ).rejects.toThrow(MediaUploadError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("still rejects an oversized image when video is allowed", async () => {
    const file = fileOf(MAX_IMAGE_SIZE_BYTES + 1, "big.jpg", "image/jpeg");

    await expect(
      uploadMedia(file, { namespace: "hero", allowVideo: true })
    ).rejects.toThrow(MediaUploadError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("purges and throws when the provider reports it stored an oversized video", async () => {
    fetchMock
      .mockResolvedValueOnce(presignResponse("hero/2026-08-25/uuid.mp4"))
      .mockResolvedValueOnce(jsonResponse({ bytes: MAX_VIDEO_SIZE_BYTES + 1 }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    await expect(
      uploadMedia(fileOf(100, "clip.mp4", "video/mp4"), {
        namespace: "hero",
        allowVideo: true,
      })
    ).rejects.toThrow(MediaUploadError);

    const [purgeUrl, purgeInit] = fetchMock.mock.calls[2];
    expect(purgeUrl).toBe("/api/media/delete");
    expect(JSON.parse(purgeInit.body)).toEqual({ key: "hero/2026-08-25/uuid.mp4" });
  });

  it("does not purge a video that is under the video cap but over the image cap", async () => {
    fetchMock
      .mockResolvedValueOnce(presignResponse("hero/2026-08-25/uuid.mp4"))
      .mockResolvedValueOnce(jsonResponse({ bytes: MAX_IMAGE_SIZE_BYTES + 1 }));

    await uploadMedia(fileOf(100, "clip.mp4", "video/mp4"), {
      namespace: "hero",
      allowVideo: true,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("rejects a disallowed content type outright", async () => {
    await expect(
      uploadMedia(fileOf(10, "virus.exe", "application/octet-stream"), {
        namespace: "hero",
        allowVideo: true,
      })
    ).rejects.toThrow(MediaUploadError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws when the presign call fails", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "Not found" }, false));

    await expect(
      uploadMedia(fileOf(100, "clip.mp4", "video/mp4"), {
        namespace: "hero",
        allowVideo: true,
      })
    ).rejects.toThrow(MediaUploadError);
  });

  it("throws when the upload itself fails", async () => {
    fetchMock
      .mockResolvedValueOnce(presignResponse("hero/2026-08-25/uuid.mp4"))
      .mockResolvedValueOnce(jsonResponse({}, false));

    await expect(
      uploadMedia(fileOf(100, "clip.mp4", "video/mp4"), {
        namespace: "hero",
        allowVideo: true,
      })
    ).rejects.toThrow(MediaUploadError);
  });

  it("throws a user-friendly error when the upload fetch call throws a network error", async () => {
    fetchMock
      .mockResolvedValueOnce(presignResponse("hero/2026-08-25/uuid.mp4"))
      .mockRejectedValueOnce(new TypeError("Failed to fetch")); // network error

    await expect(
      uploadMedia(fileOf(100, "clip.mp4", "video/mp4"), {
        namespace: "hero",
        allowVideo: true,
      })
    ).rejects.toThrow("Kết nối mạng bị gián đoạn. Vui lòng kiểm tra lại mạng hoặc tắt trình chặn quảng cáo rồi thử lại.");
  });
});
