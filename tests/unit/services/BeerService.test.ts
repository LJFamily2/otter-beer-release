// Mocked so this orchestration-only test never pulls in the real Mongoose
// model chain (BeerRepository -> BeerModel -> mongoose) — unlike
// PermissionService.test.ts, nothing here needs a genuine subdocument.
jest.mock("@/repositories/BeerRepository");

import { BeerService } from "@/services/BeerService";
import { BeerRepository } from "@/repositories/BeerRepository";
import type { BeerCreateInput, BeerUpdateInput } from "@/lib/validation/beer";

function fakeTranslations() {
  return [
    { locale: "vi", style: "Premium Lager", headline: "BREWING\nCONNECTIONS.", description: "..." },
  ];
}

describe("BeerService", () => {
  let repository: BeerRepository;
  let service: BeerService;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      updateById: jest.fn(),
      findById: jest.fn(),
      clearFeaturedExcept: jest.fn(),
      listShowcasePublished: jest.fn(),
    } as unknown as BeerRepository;
    service = new BeerService(repository);
  });

  describe("create", () => {
    it("clears other featured beers when the new beer is created as featured", async () => {
      const created = { _id: "beer-1", isFeatured: true };
      (repository.create as jest.Mock).mockResolvedValue(created);

      const input: BeerCreateInput = {
        abv: 4.3,
        ibu: 20,
        isFeatured: true,
        status: "draft",
        translations: fakeTranslations(),
        variants: [],
        imageNames: [],
      };
      await service.create(input, "507f1f77bcf86cd799439011");

      expect(repository.clearFeaturedExcept).toHaveBeenCalledWith("beer-1");
    });

    it("passes theme colors through to the repository", async () => {
      const created = { _id: "beer-1", isFeatured: false };
      (repository.create as jest.Mock).mockResolvedValue(created);

      const input: BeerCreateInput = {
        abv: 4.3,
        ibu: 20,
        isFeatured: false,
        status: "draft",
        themeColor: "#002867",
        themeColorContainer: "#1d3f82",
        translations: fakeTranslations(),
        variants: [],
        imageNames: [],
      };
      await service.create(input, "507f1f77bcf86cd799439011");

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          themeColor: "#002867",
          themeColorContainer: "#1d3f82",
        })
      );
    });

    it("does not touch other featured beers when the new beer is not featured", async () => {
      const created = { _id: "beer-1", isFeatured: false };
      (repository.create as jest.Mock).mockResolvedValue(created);

      const input: BeerCreateInput = {
        abv: 4.3,
        ibu: 20,
        isFeatured: false,
        status: "draft",
        translations: fakeTranslations(),
        variants: [],
        imageNames: [],
      };
      await service.create(input, "507f1f77bcf86cd799439011");

      expect(repository.clearFeaturedExcept).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("clears other featured beers when this beer is updated to featured", async () => {
      (repository.findById as jest.Mock).mockResolvedValue({ _id: "beer-1" });
      (repository.updateById as jest.Mock).mockResolvedValue({ _id: "beer-1", isFeatured: true });

      const input: BeerUpdateInput = { isFeatured: true };
      await service.update("beer-1", input, "507f1f77bcf86cd799439011");

      expect(repository.clearFeaturedExcept).toHaveBeenCalledWith("beer-1");
    });

    it("returns null without writing when the beer doesn't exist", async () => {
      (repository.findById as jest.Mock).mockResolvedValue(null);

      const result = await service.update("missing", { isFeatured: true }, "507f1f77bcf86cd799439011");

      expect(result).toBeNull();
      expect(repository.updateById).not.toHaveBeenCalled();
    });

    it("includes theme colors in the update when provided", async () => {
      (repository.findById as jest.Mock).mockResolvedValue({ _id: "beer-1" });
      (repository.updateById as jest.Mock).mockResolvedValue({ _id: "beer-1" });

      await service.update(
        "beer-1",
        { themeColor: "#b22a2a", themeColorContainer: "#8b1f1f" },
        "507f1f77bcf86cd799439011"
      );

      expect(repository.updateById).toHaveBeenCalledWith(
        "beer-1",
        expect.objectContaining({ themeColor: "#b22a2a", themeColorContainer: "#8b1f1f" })
      );
    });

    it("clears a theme color when explicitly set to null", async () => {
      (repository.findById as jest.Mock).mockResolvedValue({ _id: "beer-1" });
      (repository.updateById as jest.Mock).mockResolvedValue({ _id: "beer-1" });

      await service.update("beer-1", { themeColor: null }, "507f1f77bcf86cd799439011");

      expect(repository.updateById).toHaveBeenCalledWith(
        "beer-1",
        expect.objectContaining({ themeColor: undefined })
      );
    });
  });

  describe("listShowcasePublished", () => {
    it("delegates to the repository", async () => {
      const beers = [{ _id: "beer-1" }, { _id: "beer-2" }];
      (repository.listShowcasePublished as jest.Mock).mockResolvedValue(beers);

      const result = await service.listShowcasePublished();

      expect(repository.listShowcasePublished).toHaveBeenCalled();
      expect(result).toBe(beers);
    });
  });
});
