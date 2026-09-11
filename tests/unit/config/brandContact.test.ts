import {
  ADDRESS,
  CONTACT,
  GEO,
  MAP_URL,
  formatGeo,
} from "@/config/brand";
import { buildBreweryJsonLd } from "@/lib/seo";

describe("GEO", () => {
  /**
   * These two used to be independent literals: brand.ts said 11.3254/106.0967
   * (published in the Brewery JSON-LD) while Contact.tsx's visible badge said
   * 11.3385/106.1144. Different spots. A geo/NAP mismatch between visible copy
   * and structured data is the classic local-SEO trust penalty, so the badge is
   * now derived from this one source.
   */
  it("matches the location the Contact map is pinned to", () => {
    expect(GEO.latitude).toBeCloseTo(11.3385, 4);
    expect(GEO.longitude).toBeCloseTo(106.1144, 4);
  });

  it("sits inside Tay Ninh province's plausible bounds", () => {
    expect(GEO.latitude).toBeGreaterThan(10.9);
    expect(GEO.latitude).toBeLessThan(11.8);
    expect(GEO.longitude).toBeGreaterThan(105.8);
    expect(GEO.longitude).toBeLessThan(106.4);
  });

  it("feeds the Brewery structured data verbatim", () => {
    const brewery = buildBreweryJsonLd("vi") as {
      geo: { latitude: number; longitude: number };
    };

    expect(brewery.geo.latitude).toBe(GEO.latitude);
    expect(brewery.geo.longitude).toBe(GEO.longitude);
  });
});

describe("formatGeo", () => {
  it("renders English cardinal letters", () => {
    expect(formatGeo("en")).toBe("11.3385° N, 106.1144° E");
  });

  it("renders Vietnamese cardinal letters", () => {
    expect(formatGeo("vi")).toBe("11.3385° B, 106.1144° Đ");
  });

  it("falls back to English letters for an unknown locale", () => {
    expect(formatGeo("fr")).toContain("° N");
  });

  it("always states the same numbers the structured data publishes", () => {
    for (const locale of ["vi", "en"]) {
      expect(formatGeo(locale)).toContain(GEO.latitude.toFixed(4));
      expect(formatGeo(locale)).toContain(GEO.longitude.toFixed(4));
    }
  });
});

describe("MAP_URL", () => {
  it("is an absolute Google Maps link, safe to render as an external href", () => {
    const url = new URL(MAP_URL);
    expect(url.protocol).toBe("https:");
    expect(url.hostname).toMatch(/google\.com$/);
  });

  it("routes to the exact pin rather than a fuzzy address search", () => {
    const url = new URL(MAP_URL);

    expect(url.searchParams.get("destination")).toBe(
      `${GEO.latitude},${GEO.longitude}`
    );
  });

  it("uses the directions endpoint, matching what the button promises", () => {
    expect(MAP_URL).toContain("/maps/dir/");
    expect(new URL(MAP_URL).searchParams.get("api")).toBe("1");
  });
});

describe("NAP consistency", () => {
  it("keeps the schema address in the province the metadata claims", () => {
    expect(ADDRESS.addressRegion).toBe("Tay Ninh Province");
    expect(ADDRESS.addressCountry).toBe("VN");
  });

  it("keeps phone numbers in E.164 for structured data", () => {
    for (const phone of CONTACT.phones) {
      expect(phone).toMatch(/^\+84\d{9,10}$/);
    }
  });
});
