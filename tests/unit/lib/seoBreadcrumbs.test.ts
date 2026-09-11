import {
  blogPostBreadcrumbTrail,
  buildBreadcrumbJsonLd,
  toBreadcrumbItems,
  type BreadcrumbEntry,
} from "@/lib/seo";

const TRAIL: BreadcrumbEntry[] = [
  { name: "Home", path: "/" },
  { name: "News", path: "/blog" },
  { name: "A Post", path: "/blog/a-post" },
];

describe("toBreadcrumbItems", () => {
  it("keeps every label in order", () => {
    expect(toBreadcrumbItems("vi", TRAIL).map((i) => i.label)).toEqual([
      "Home",
      "News",
      "A Post",
    ]);
  });

  it("links every entry except the current page", () => {
    const items = toBreadcrumbItems("vi", TRAIL);

    expect(items[0].href).toBe("/");
    expect(items[1].href).toBe("/blog");
    // "Don't link to where you already are."
    expect(items[2].href).toBeUndefined();
  });

  it("prefixes non-default locales", () => {
    const items = toBreadcrumbItems("en", TRAIL);

    expect(items[0].href).toBe("/en/");
    expect(items[1].href).toBe("/en/blog");
  });

  it("leaves the default locale unprefixed", () => {
    expect(toBreadcrumbItems("vi", TRAIL)[1].href).toBe("/blog");
  });

  it("handles a single-entry trail without linking it", () => {
    expect(toBreadcrumbItems("vi", [{ name: "Home", path: "/" }])).toEqual([
      { label: "Home", href: undefined },
    ]);
  });

  /**
   * The point of this helper. The site emitted BreadcrumbList JSON-LD on
   * /contact, /blog and /blog/[slug] while rendering no visible trail at all.
   * Google's structured-data guidelines require the markup to describe a
   * breadcrumb the user can actually see, so both now consume one array.
   */
  it("produces labels matching the JSON-LD built from the same trail", () => {
    const jsonLd = buildBreadcrumbJsonLd("vi", TRAIL) as {
      itemListElement: { name: string; position: number }[];
    };
    const visible = toBreadcrumbItems("vi", TRAIL);

    expect(jsonLd.itemListElement.map((e) => e.name)).toEqual(
      visible.map((i) => i.label)
    );
    expect(jsonLd.itemListElement.map((e) => e.position)).toEqual([1, 2, 3]);
  });
});

describe("blogPostBreadcrumbTrail", () => {
  const trail = blogPostBreadcrumbTrail("Trang chủ", "Tin tức", "Bài Viết", "bai-viet");

  it("builds Home > News > post", () => {
    expect(trail.map((e) => e.name)).toEqual(["Trang chủ", "Tin tức", "Bài Viết"]);
  });

  it("points the last entry at the post's own slug", () => {
    expect(trail[2].path).toBe("/blog/bai-viet");
  });

  it("is the same trail the post's JSON-LD publishes", () => {
    const jsonLd = buildBreadcrumbJsonLd("vi", trail) as {
      itemListElement: { item: string }[];
    };

    expect(jsonLd.itemListElement.at(-1)?.item).toContain("/blog/bai-viet");
  });
});
