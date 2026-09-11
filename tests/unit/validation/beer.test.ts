import { BeerCreateSchema, BeerUpdateSchema } from "@/lib/validation/beer";

function viTranslation(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    locale: "vi",
    style: "Premium Lager",
    headline: "BREWING\nCONNECTIONS.",
    description: "A crisp, golden pour born in Tay Ninh.",
    ...overrides,
  };
}

function baseBeer(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    abv: 4.3,
    ibu: 20,
    translations: [viTranslation()],
    ...overrides,
  };
}

/** A beer with variants also needs a label for its main image — that becomes the first pill. */
function beerWithVariants(variants: unknown[], overrides: Partial<Record<string, unknown>> = {}) {
  return baseBeer({
    variants,
    imageNames: [{ locale: "vi", shortName: "LON" }],
    ...overrides,
  });
}

function variant(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    imageKey: "beers/can.png",
    names: [{ locale: "vi", shortName: "LON" }],
    ...overrides,
  };
}

describe("beer product variants", () => {
  it("defaults to an empty list when a client omits variants entirely", () => {
    const result = BeerCreateSchema.safeParse(baseBeer());
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.variants).toEqual([]);
  });

  it("accepts variants with vi-only and with both locales", () => {
    const result = BeerCreateSchema.safeParse(
      beerWithVariants([
        variant(),
        variant({
          imageKey: "beers/six-pack.png",
          names: [
            { locale: "vi", shortName: "BAO BÌ 6 LON" },
            { locale: "en", shortName: "6-PACK" },
          ],
        }),
      ])
    );
    expect(result.success).toBe(true);
  });

  it("accepts more than three variants (no cap)", () => {
    const result = BeerCreateSchema.safeParse(
      beerWithVariants([variant(), variant(), variant(), variant(), variant()])
    );
    expect(result.success).toBe(true);
  });

  it("requires a main-image label once the beer has variants", () => {
    expect(
      BeerCreateSchema.safeParse(baseBeer({ variants: [variant()] })).success
    ).toBe(false);
    expect(
      BeerCreateSchema.safeParse(
        baseBeer({ variants: [variant()], imageNames: [{ locale: "en", shortName: "CAN" }] })
      ).success
    ).toBe(false);
  });

  it("does not require a main-image label when there are no variants", () => {
    expect(BeerCreateSchema.safeParse(baseBeer({ variants: [] })).success).toBe(true);
    expect(BeerCreateSchema.safeParse(baseBeer()).success).toBe(true);
  });

  it("leaves the stored main-image label alone on a partial update", () => {
    // `imageNames` omitted means "unchanged", so adding variants alone must
    // not be rejected for a label the client never sent.
    const result = BeerUpdateSchema.safeParse({ variants: [variant()] });
    expect(result.success).toBe(true);
  });

  it("rejects a variant with no image", () => {
    expect(
      BeerCreateSchema.safeParse(baseBeer({ variants: [variant({ imageKey: "" })] })).success
    ).toBe(false);
    expect(
      BeerCreateSchema.safeParse(baseBeer({ variants: [variant({ imageKey: undefined })] }))
        .success
    ).toBe(false);
  });

  it("rejects a variant missing the required vi label", () => {
    const result = BeerCreateSchema.safeParse(
      baseBeer({ variants: [variant({ names: [{ locale: "en", shortName: "CAN" }] })] })
    );
    expect(result.success).toBe(false);
  });

  it("points the error at the offending variant index", () => {
    const result = BeerCreateSchema.safeParse(
      baseBeer({
        variants: [variant(), variant({ names: [{ locale: "en", shortName: "CAN" }] })],
      })
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.join(".") === "variants.1.names")).toBe(
        true
      );
    }
  });

  it("rejects a variant with no labels at all", () => {
    expect(
      BeerCreateSchema.safeParse(baseBeer({ variants: [variant({ names: [] })] })).success
    ).toBe(false);
  });

  it("rejects a duplicate locale within one variant", () => {
    const result = BeerCreateSchema.safeParse(
      baseBeer({
        variants: [
          variant({
            names: [
              { locale: "vi", shortName: "LON" },
              { locale: "vi", shortName: "LON LỚN" },
            ],
          }),
        ],
      })
    );
    expect(result.success).toBe(false);
  });

  it("rejects a label longer than 40 characters", () => {
    const result = BeerCreateSchema.safeParse(
      baseBeer({
        variants: [variant({ names: [{ locale: "vi", shortName: "L".repeat(41) }] })],
      })
    );
    expect(result.success).toBe(false);
  });

  it("lets an update clear every variant with an empty array", () => {
    const result = BeerUpdateSchema.safeParse({ variants: [] });
    expect(result.success).toBe(true);
  });

  it("still validates variants supplied on update", () => {
    expect(BeerUpdateSchema.safeParse({ variants: [variant()] }).success).toBe(true);
    expect(
      BeerUpdateSchema.safeParse({ variants: [variant({ imageKey: "" })] }).success
    ).toBe(false);
  });
});

describe("BeerCreateSchema", () => {
  it("accepts a valid beer with only the required (vi) locale", () => {
    const result = BeerCreateSchema.safeParse(baseBeer());
    expect(result.success).toBe(true);
  });

  it("rejects a beer missing the required vi locale", () => {
    const result = BeerCreateSchema.safeParse(
      baseBeer({ translations: [viTranslation({ locale: "en" })] })
    );
    expect(result.success).toBe(false);
  });

  it("rejects duplicate locales in the same beer", () => {
    const result = BeerCreateSchema.safeParse(
      baseBeer({ translations: [viTranslation(), viTranslation()] })
    );
    expect(result.success).toBe(false);
  });

  it("rejects an unsupported locale code", () => {
    const result = BeerCreateSchema.safeParse(
      baseBeer({ translations: [{ ...viTranslation(), locale: "fr" }] })
    );
    expect(result.success).toBe(false);
  });

  it("rejects ABV/IBU out of range", () => {
    expect(BeerCreateSchema.safeParse(baseBeer({ abv: -1 })).success).toBe(false);
    expect(BeerCreateSchema.safeParse(baseBeer({ abv: 101 })).success).toBe(false);
    expect(BeerCreateSchema.safeParse(baseBeer({ ibu: 201 })).success).toBe(false);
  });

  it("rejects a missing ABV or IBU", () => {
    expect(BeerCreateSchema.safeParse({ ibu: 20, translations: [viTranslation()] }).success).toBe(false);
    expect(BeerCreateSchema.safeParse({ abv: 4.3, translations: [viTranslation()] }).success).toBe(false);
  });

  it("defaults status to draft and isFeatured to false", () => {
    const result = BeerCreateSchema.parse(baseBeer());
    expect(result.status).toBe("draft");
    expect(result.isFeatured).toBe(false);
  });

  it("accepts valid 6-digit hex theme colors", () => {
    const result = BeerCreateSchema.safeParse(
      baseBeer({ themeColor: "#002867", themeColorContainer: "#1d3f82" })
    );
    expect(result.success).toBe(true);
  });

  it("allows omitting theme colors entirely", () => {
    const result = BeerCreateSchema.safeParse(baseBeer());
    expect(result.success).toBe(true);
  });

  it("rejects a malformed hex theme color", () => {
    expect(BeerCreateSchema.safeParse(baseBeer({ themeColor: "002867" })).success).toBe(false);
    expect(BeerCreateSchema.safeParse(baseBeer({ themeColor: "#00286" })).success).toBe(false);
    expect(BeerCreateSchema.safeParse(baseBeer({ themeColor: "red" })).success).toBe(false);
    expect(
      BeerCreateSchema.safeParse(baseBeer({ themeColorContainer: "#gggggg" })).success
    ).toBe(false);
  });
});

describe("BeerUpdateSchema", () => {
  it("allows a partial update with no translations", () => {
    const result = BeerUpdateSchema.safeParse({ status: "published" });
    expect(result.success).toBe(true);
  });

  it("still enforces the required-locale rule when translations are provided", () => {
    const result = BeerUpdateSchema.safeParse({
      translations: [{ ...viTranslation(), locale: "en" }],
    });
    expect(result.success).toBe(false);
  });

  it("allows clearing imageKey/shopUrl/findLocallyUrl via null", () => {
    const result = BeerUpdateSchema.safeParse({
      imageKey: null,
      shopUrl: null,
      findLocallyUrl: null,
    });
    expect(result.success).toBe(true);
  });

  it("allows clearing theme colors via null", () => {
    const result = BeerUpdateSchema.safeParse({
      themeColor: null,
      themeColorContainer: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a malformed hex theme color on update", () => {
    const result = BeerUpdateSchema.safeParse({ themeColor: "not-a-color" });
    expect(result.success).toBe(false);
  });
});
