import { uploadImage, ImageUploadError } from "@/lib/utils/uploadImage";
import { MAX_IMAGE_SIZE_BYTES } from "@/lib/storage/constants";

function smallFile(name = "cover.jpg", type = "image/jpeg") {
  return new File([new Uint8Array(100)], name, { type });
}

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body };
}

describe("uploadImage", () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("rejects a disallowed content type before making any network call", async () => {
    const file = smallFile("virus.exe", "application/octet-stream");
    await expect(uploadImage(file)).rejects.toThrow(ImageUploadError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an oversized file client-side before making any network call", async () => {
    const file = new File([new Uint8Array(MAX_IMAGE_SIZE_BYTES + 1)], "big.jpg", {
      type: "image/jpeg",
    });
    await expect(uploadImage(file)).rejects.toThrow(ImageUploadError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns the object key and public URL on a normal upload", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          key: "news-blog/2026-08-17/uuid.jpg",
          url: "https://api.cloudinary.com/v1_1/otterbeer-test/image/upload",
          fields: { api_key: "x", timestamp: "1", public_id: "p", signature: "s" },
        })
      )
      .mockResolvedValueOnce(jsonResponse({ bytes: 100 }));

    const result = await uploadImage(smallFile());

    expect(result).toEqual({
      key: "news-blog/2026-08-17/uuid.jpg",
      url: "/api/media/public/news-blog/2026-08-17/uuid.jpg",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("purges the object and throws when Cloudinary reports it stored an oversized file", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          key: "news-blog/2026-08-17/uuid.jpg",
          url: "https://api.cloudinary.com/v1_1/otterbeer-test/image/upload",
          fields: { api_key: "x", timestamp: "1", public_id: "p", signature: "s" },
        })
      )
      .mockResolvedValueOnce(jsonResponse({ bytes: MAX_IMAGE_SIZE_BYTES + 1 }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    await expect(uploadImage(smallFile())).rejects.toThrow(ImageUploadError);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "/api/media/delete",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ key: "news-blog/2026-08-17/uuid.jpg" }),
      })
    );
  });

  it("does not throw when the upload response has no parseable body (e.g. R2's empty 204)", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          key: "news-blog/2026-08-17/uuid.jpg",
          url: "https://example.r2.cloudflarestorage.com/bucket",
          fields: { "Content-Type": "image/jpeg" },
        })
      )
      .mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new SyntaxError("Unexpected end of JSON input");
        },
      });

    const result = await uploadImage(smallFile());

    expect(result.key).toBe("news-blog/2026-08-17/uuid.jpg");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
