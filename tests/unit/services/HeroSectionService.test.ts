// Mocked so this orchestration-only test never pulls in the real Mongoose
// model chain — same rationale as BrandStoryService.test.ts.
jest.mock("@/repositories/HeroSectionRepository");

import { HeroSectionService } from "@/services/HeroSectionService";
import { HeroSectionRepository } from "@/repositories/HeroSectionRepository";
import type { HeroSectionUpdateInput } from "@/lib/validation/heroSection";

const ACTOR_ID = "507f1f77bcf86cd799439011";

function slide(overrides: Record<string, unknown> = {}) {
  return {
    mediaKey: "hero/2026-08-25/uuid.jpg",
    mediaType: "image" as const,
    status: "published" as const,
    translations: [{ locale: "vi", alt: "Alt" }],
    ...overrides,
  };
}

describe("HeroSectionService", () => {
  let repository: HeroSectionRepository;
  let service: HeroSectionService;

  beforeEach(() => {
    repository = {
      get: jest.fn(),
      replaceSlides: jest.fn(),
    } as unknown as HeroSectionRepository;
    service = new HeroSectionService(repository);
  });

  describe("get", () => {
    it("delegates to the repository", async () => {
      const doc = { slides: [] };
      (repository.get as jest.Mock).mockResolvedValue(doc);

      expect(await service.get()).toBe(doc);
    });

    it("returns null when no document has ever been saved", async () => {
      (repository.get as jest.Mock).mockResolvedValue(null);

      expect(await service.get()).toBeNull();
    });
  });

  describe("replaceSlides", () => {
    it("passes the input slides and actor id through to the repository", async () => {
      const input: HeroSectionUpdateInput = { slides: [slide()] };
      const saved = { slides: input.slides };
      (repository.replaceSlides as jest.Mock).mockResolvedValue(saved);

      const result = await service.replaceSlides(input, ACTOR_ID);

      expect(repository.replaceSlides).toHaveBeenCalledWith(input.slides, ACTOR_ID);
      expect(result).toBe(saved);
    });

    it("passes an empty slides array through unchanged", async () => {
      const input: HeroSectionUpdateInput = { slides: [] };
      (repository.replaceSlides as jest.Mock).mockResolvedValue({ slides: [] });

      await service.replaceSlides(input, ACTOR_ID);

      expect(repository.replaceSlides).toHaveBeenCalledWith([], ACTOR_ID);
    });
  });

  describe("listPublishedSlides", () => {
    it("returns only published slides", async () => {
      (repository.get as jest.Mock).mockResolvedValue({
        slides: [
          slide({ mediaKey: "a.jpg", status: "published" }),
          slide({ mediaKey: "b.jpg", status: "draft" }),
          slide({ mediaKey: "c.mp4", mediaType: "video", status: "published" }),
        ],
      });

      const result = await service.listPublishedSlides();

      expect(result.map((s) => s.mediaKey)).toEqual(["a.jpg", "c.mp4"]);
    });

    it("preserves the admin-defined order", async () => {
      (repository.get as jest.Mock).mockResolvedValue({
        slides: [
          slide({ mediaKey: "third.jpg" }),
          slide({ mediaKey: "first.jpg" }),
          slide({ mediaKey: "second.jpg" }),
        ],
      });

      const result = await service.listPublishedSlides();

      expect(result.map((s) => s.mediaKey)).toEqual([
        "third.jpg",
        "first.jpg",
        "second.jpg",
      ]);
    });

    it("returns an empty array when the singleton has never been saved", async () => {
      (repository.get as jest.Mock).mockResolvedValue(null);

      expect(await service.listPublishedSlides()).toEqual([]);
    });

    it("returns an empty array when every slide is a draft", async () => {
      (repository.get as jest.Mock).mockResolvedValue({
        slides: [slide({ status: "draft" })],
      });

      expect(await service.listPublishedSlides()).toEqual([]);
    });
  });
});
