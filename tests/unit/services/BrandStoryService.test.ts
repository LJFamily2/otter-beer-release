// Mocked so this orchestration-only test never pulls in the real Mongoose
// model chain — same rationale as BeerService.test.ts.
jest.mock("@/repositories/BrandStoryRepository");

import { BrandStoryService } from "@/services/BrandStoryService";
import { BrandStoryRepository } from "@/repositories/BrandStoryRepository";
import type { BrandStoryUpdateInput } from "@/lib/validation/brandStory";

describe("BrandStoryService", () => {
  let repository: BrandStoryRepository;
  let service: BrandStoryService;

  beforeEach(() => {
    repository = {
      get: jest.fn(),
      replaceChapters: jest.fn(),
    } as unknown as BrandStoryRepository;
    service = new BrandStoryService(repository);
  });

  describe("get", () => {
    it("delegates to the repository", async () => {
      const doc = { chapters: [] };
      (repository.get as jest.Mock).mockResolvedValue(doc);

      const result = await service.get();

      expect(result).toBe(doc);
    });

    it("returns null when no document has ever been saved", async () => {
      (repository.get as jest.Mock).mockResolvedValue(null);

      const result = await service.get();

      expect(result).toBeNull();
    });
  });

  describe("getPublished", () => {
    it("returns the same singleton document as get() (no draft/published split)", async () => {
      const doc = { chapters: [{ images: ["k1"] }] };
      (repository.get as jest.Mock).mockResolvedValue(doc);

      const result = await service.getPublished();

      expect(result).toBe(doc);
    });
  });

  describe("replaceChapters", () => {
    it("passes the input chapters and actor id through to the repository", async () => {
      const input: BrandStoryUpdateInput = {
        chapters: [
          {
            images: ["k1"],
            translations: [{ locale: "vi", title: "Our Story" }],
          },
        ],
      };
      const saved = { chapters: input.chapters };
      (repository.replaceChapters as jest.Mock).mockResolvedValue(saved);

      const result = await service.replaceChapters(input, "507f1f77bcf86cd799439011");

      expect(repository.replaceChapters).toHaveBeenCalledWith(
        input.chapters,
        "507f1f77bcf86cd799439011"
      );
      expect(result).toBe(saved);
    });

    it("passes an empty chapters array through unchanged", async () => {
      const input: BrandStoryUpdateInput = { chapters: [] };
      (repository.replaceChapters as jest.Mock).mockResolvedValue({ chapters: [] });

      await service.replaceChapters(input, "507f1f77bcf86cd799439011");

      expect(repository.replaceChapters).toHaveBeenCalledWith([], "507f1f77bcf86cd799439011");
    });
  });
});
