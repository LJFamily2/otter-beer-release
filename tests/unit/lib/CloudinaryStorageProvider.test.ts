import { createHash } from "node:crypto";
import { CloudinaryStorageProvider } from "@/lib/storage/CloudinaryStorageProvider";

const config = {
  cloudName: "otterbeer-test",
  apiKey: "test-api-key",
  apiSecret: "test-api-secret",
  uploadPreset: "otterbeer-images",
};

function expectedSignature(params: Record<string, string>) {
  const toSign = Object.keys(params)
    .sort()
    .map((name) => `${name}=${params[name]}`)
    .join("&");
  return createHash("sha1").update(`${toSign}${config.apiSecret}`).digest("hex");
}

describe("CloudinaryStorageProvider", () => {
  let provider: CloudinaryStorageProvider;

  beforeEach(() => {
    provider = new CloudinaryStorageProvider(config);
  });

  describe("createPresignedUpload", () => {
    it("strips the file extension from the public_id but keeps it on the returned key", async () => {
      const upload = await provider.createPresignedUpload({
        key: "news-blog/2026-08-17/uuid.jpg",
        contentType: "image/jpeg",
        maxSizeBytes: 5 * 1024 * 1024,
      });

      expect(upload.key).toBe("news-blog/2026-08-17/uuid.jpg");
      expect(upload.fields.public_id).toBe("news-blog/2026-08-17/uuid");
      expect(upload.url).toBe(
        "https://api.cloudinary.com/v1_1/otterbeer-test/image/upload"
      );
    });

    it("includes the upload preset and a valid signature", async () => {
      const upload = await provider.createPresignedUpload({
        key: "news-blog/2026-08-17/uuid.png",
        contentType: "image/png",
        maxSizeBytes: 5 * 1024 * 1024,
      });

      expect(upload.fields.upload_preset).toBe(config.uploadPreset);
      expect(upload.fields.api_key).toBe(config.apiKey);
      expect(upload.fields.signature).toBe(
        expectedSignature({
          public_id: upload.fields.public_id,
          timestamp: upload.fields.timestamp,
          upload_preset: upload.fields.upload_preset,
        })
      );
    });
  });

  describe("createViewUrl", () => {
    it("builds a public CDN URL with f_auto,q_auto and no extension", async () => {
      const url = await provider.createViewUrl({
        key: "news-blog/2026-08-17/uuid.webp",
      });

      expect(url).toBe(
        "https://res.cloudinary.com/otterbeer-test/image/upload/f_auto,q_auto/news-blog/2026-08-17/uuid"
      );
    });
  });

  describe("getObject", () => {
    const fetchMock = jest.fn();

    beforeEach(() => {
      global.fetch = fetchMock;
      fetchMock.mockReset();
    });

    it("returns the bytes and content type on success", async () => {
      const bytes = new Uint8Array([1, 2, 3]);
      fetchMock.mockResolvedValue({
        ok: true,
        arrayBuffer: async () => bytes.buffer,
        headers: new Headers({ "content-type": "image/webp" }),
      });

      const result = await provider.getObject("news-blog/2026-08-17/uuid.webp");

      expect(result).toEqual({ body: bytes, contentType: "image/webp" });
    });

    it("returns null when the fetch is not ok", async () => {
      fetchMock.mockResolvedValue({ ok: false });

      const result = await provider.getObject("news-blog/2026-08-17/missing.webp");

      expect(result).toBeNull();
    });
  });

  describe("deleteObject", () => {
    it("POSTs a signed destroy request with the extension-stripped public_id", async () => {
      const fetchMock = jest.fn().mockResolvedValue({ ok: true });
      global.fetch = fetchMock;

      await provider.deleteObject("news-blog/2026-08-17/uuid.jpg");

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.cloudinary.com/v1_1/otterbeer-test/image/destroy",
        expect.objectContaining({ method: "POST" })
      );
      const body = fetchMock.mock.calls[0][1].body as URLSearchParams;
      expect(body.get("public_id")).toBe("news-blog/2026-08-17/uuid");
      expect(body.get("signature")).toBe(
        expectedSignature({
          public_id: "news-blog/2026-08-17/uuid",
          timestamp: body.get("timestamp") as string,
        })
      );
    });
  });
});
