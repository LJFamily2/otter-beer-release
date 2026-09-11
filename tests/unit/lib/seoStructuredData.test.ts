import {
  buildBeerProductsJsonLd,
  buildBreadcrumbJsonLd,
  buildBreweryJsonLd,
  buildFaqJsonLd,
  buildHomeJsonLd,
  buildHomeMetadata,
  buildOrganizationJsonLd,
  buildStaticPageMetadata,
  buildWebSiteJsonLd,
  buildSiteNavigationJsonLd,
  jsonLdGraph,
  organizationId,
  staticAlternates,
} from "@/lib/seo";
import { faqFor } from "@/config/faq";
import { ADDRESS, CONTACT, LEGAL_NAME } from "@/config/brand";
import type { BeerShowcaseItem } from "@/lib/utils/BeerPresenter";

const beer: BeerShowcaseItem = {
  id: "abc123",
  abv: "5.2%",
  ibu: 24,
  imageSrc: "/images/otter-beer-single-can.png",
  style: "PREMIUM LAGER",
  headline: "Otter\nPremium Lager",
  description: "A crisp golden lager.",
  themeColor: "#002867",
  themeColorContainer: "#123456",
  variants: [],
};

/** Nodes in a @graph, keyed by @type, for terse assertions. */
function nodesByType(graph: Record<string, unknown>) {
  const nodes = graph["@graph"] as Record<string, unknown>[];
  return new Map(nodes.map((n) => [n["@type"] as string, n]));
}

describe("staticAlternates", () => {
  it("includes every supported locale plus x-default", () => {
    const alternates = staticAlternates("/contact");

    expect(alternates.vi).toMatch(/\/contact$/);
    expect(alternates.en).toMatch(/\/en\/contact$/);
    // x-default is what a user with no matching language gets served; leaving
    // it out is one of the most common international-SEO mistakes.
    expect(alternates["x-default"]).toBe(alternates.vi);
  });
});

describe("buildStaticPageMetadata", () => {
  it("sets a canonical, hreflang set, and an absolute OG image", () => {
    const metadata = buildStaticPageMetadata({
      locale: "en",
      path: "/contact",
      title: "Contact",
      description: "Reach the brewery.",
    });

    expect(metadata.alternates?.canonical).toMatch(/\/en\/contact$/);
    expect(metadata.alternates?.languages).toHaveProperty("x-default");
    expect(metadata.openGraph?.images).toBeDefined();

    const images = metadata.openGraph?.images as { url: string }[];
    expect(images[0].url).toMatch(/^https?:\/\//);
  });

  it("marks a page noindex when asked, and leaves it indexable otherwise", () => {
    expect(
      buildStaticPageMetadata({
        locale: "vi",
        path: "/age-verification",
        title: "Age",
        description: "Gate.",
        noIndex: true,
      }).robots
    ).toEqual({ index: false, follow: true });

    expect(
      buildStaticPageMetadata({
        locale: "vi",
        path: "/contact",
        title: "Contact",
        description: "Reach us.",
      }).robots
    ).toBeUndefined();
  });
});

describe("buildHomeMetadata", () => {
  it("names the brand, the product category and the place in both locales", () => {
    for (const locale of ["vi", "en"]) {
      const metadata = buildHomeMetadata(locale);
      const title = metadata.title as { absolute: string };

      expect(title.absolute).toMatch(/Otter Beer/i);
      expect(String(metadata.description)).toMatch(/Tây Ninh|Tay Ninh/i);
      expect(metadata.keywords?.length).toBeGreaterThan(0);
    }
  });

  it("opts out of the title template, which already appends the brand", () => {
    // Without this the homepage title renders the brand twice
    // ("Otter Beer — Bia Thủ Công Tây Ninh | Otter Beer") and overruns the
    // ~60 characters Google shows.
    const title = buildHomeMetadata("vi").title as { absolute: string };

    expect(title.absolute).toBeDefined();
    expect(title.absolute).not.toMatch(/Otter Beer.*Otter Beer/);
  });

  it("canonicalises each locale to its own URL", () => {
    expect(buildHomeMetadata("vi").alternates?.canonical).toMatch(/\/$/);
    expect(buildHomeMetadata("en").alternates?.canonical).toMatch(/\/en\/$/);
  });

  it("keeps the description inside the length Google renders", () => {
    for (const locale of ["vi", "en"]) {
      const description = String(buildHomeMetadata(locale).description);
      expect(description.length).toBeLessThanOrEqual(320);
      expect(description.length).toBeGreaterThan(70);
    }
  });
});

describe("buildOrganizationJsonLd", () => {
  it("carries the legal entity, a postal address and reachable contact points", () => {
    const org = buildOrganizationJsonLd();

    expect(org["@type"]).toBe("Organization");
    expect(org.legalName).toBe(LEGAL_NAME);
    expect(org.email).toBe(CONTACT.email);
    expect(org.address).toMatchObject({
      "@type": "PostalAddress",
      addressCountry: ADDRESS.addressCountry,
    });
    expect(org.contactPoint).toHaveLength(CONTACT.phones.length);
  });
});

describe("buildWebSiteJsonLd", () => {
  it("references the organization rather than restating it", () => {
    const site = buildWebSiteJsonLd("vi");

    expect(site.publisher).toEqual({ "@id": organizationId() });
    expect(site.potentialAction).toMatchObject({ "@type": "SearchAction" });
  });
});

describe("buildSiteNavigationJsonLd", () => {
  it("emits the SiteNavigationElement with standard menu links", () => {
    const nav = buildSiteNavigationJsonLd("vi");
    
    expect(nav["@type"]).toBe("ItemList");
    expect(nav.itemListElement).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ "@type": "SiteNavigationElement", name: "Sản phẩm" }),
        expect.objectContaining({ "@type": "SiteNavigationElement", name: "Liên hệ" }),
      ])
    );
  });
});

describe("buildBreweryJsonLd", () => {
  it("emits the LocalBusiness fields a map/local result needs", () => {
    const brewery = buildBreweryJsonLd("vi");

    expect(brewery["@type"]).toBe("Brewery");
    expect(brewery.telephone).toBe(CONTACT.phones[0]);
    expect(brewery.geo).toMatchObject({ "@type": "GeoCoordinates" });
    expect(brewery.openingHours).toEqual(expect.arrayContaining([expect.any(String)]));
    expect(brewery.parentOrganization).toEqual({ "@id": organizationId() });
  });

  it("keeps the structured address identical to the visible one", () => {
    // A footer/contact address that disagrees with the structured data is the
    // classic local-SEO trust penalty, so this is asserted rather than assumed.
    expect(buildBreweryJsonLd("vi").address).toMatchObject({
      streetAddress: ADDRESS.streetAddress,
      addressRegion: ADDRESS.addressRegion,
    });
  });
});

describe("buildBeerProductsJsonLd", () => {
  it("exposes the ABV/IBU specs that are otherwise locked in a client carousel", () => {
    const [product] = buildBeerProductsJsonLd([beer]);

    expect(product["@type"]).toBe("Product");
    // The headline's newline is collapsed — a name with a raw \n in it is
    // rejected by validators and reads badly when quoted back.
    expect(product.name).toBe("Otter Premium Lager");
    expect(product.brand).toEqual({ "@id": organizationId() });
    expect(product.additionalProperty).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "ABV", value: "5.2%" }),
        expect.objectContaining({ name: "IBU", value: "24" }),
      ])
    );
  });

  it("makes a relative product image absolute", () => {
    const [product] = buildBeerProductsJsonLd([beer]);
    expect(String(product.image)).toMatch(/^https?:\/\/.+\/images\//);
  });

  it("returns nothing when there are no beers", () => {
    expect(buildBeerProductsJsonLd([])).toEqual([]);
  });
});

describe("buildFaqJsonLd", () => {
  it("turns each entry into a Question with an accepted Answer", () => {
    const faq = buildFaqJsonLd("vi", faqFor("vi"));
    const questions = faq.mainEntity as Record<string, unknown>[];

    expect(faq["@type"]).toBe("FAQPage");
    expect(questions).toHaveLength(faqFor("vi").length);
    expect(questions[0]).toMatchObject({
      "@type": "Question",
      acceptedAnswer: { "@type": "Answer" },
    });
  });
});

describe("buildBreadcrumbJsonLd", () => {
  it("numbers the trail from 1 and resolves each item to an absolute URL", () => {
    const crumbs = buildBreadcrumbJsonLd("en", [
      { name: "Home", path: "/" },
      { name: "Contact", path: "/contact" },
    ]);
    const items = crumbs.itemListElement as Record<string, unknown>[];

    expect(items[0].position).toBe(1);
    expect(items[1].position).toBe(2);
    expect(String(items[1].item)).toMatch(/\/en\/contact$/);
  });
});

describe("jsonLdGraph", () => {
  it("drops empty nodes so no dangling entry ships", () => {
    const graph = jsonLdGraph([{ "@type": "Thing" }, null, undefined]);
    expect(graph["@graph"]).toHaveLength(1);
    expect(graph["@context"]).toBe("https://schema.org");
  });
});

describe("buildHomeJsonLd", () => {
  it("bundles publisher, site, brewery, products and FAQ into one graph", () => {
    const graph = buildHomeJsonLd("vi", [beer], faqFor("vi"));
    const types = nodesByType(graph);

    expect([...types.keys()]).toEqual(
      expect.arrayContaining([
        "Organization",
        "WebSite",
        "Brewery",
        "Product",
        "FAQPage",
      ])
    );
  });

  it("omits the FAQ node entirely when there are no entries", () => {
    const graph = buildHomeJsonLd("vi", [beer], []);
    expect(nodesByType(graph).has("FAQPage")).toBe(false);
  });

  it("still emits the brand entities when no beers are published", () => {
    const types = nodesByType(buildHomeJsonLd("vi", [], faqFor("vi")));

    expect(types.has("Organization")).toBe(true);
    expect(types.has("Product")).toBe(false);
  });

  it("serialises to valid JSON", () => {
    // This object is inlined via dangerouslySetInnerHTML; anything
    // unserialisable would ship a broken <script> tag to every visitor.
    expect(() =>
      JSON.parse(JSON.stringify(buildHomeJsonLd("vi", [beer], faqFor("vi"))))
    ).not.toThrow();
  });
});
