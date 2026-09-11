import sitemap from "@/app/sitemap";
import { blogPostService } from "@/services/BlogPostService";

jest.mock("@/services/BlogPostService", () => ({
  blogPostService: { listPublished: jest.fn() },
}));

const listPublished = blogPostService.listPublished as jest.Mock;

const post = {
  updatedAt: new Date("2026-01-15T00:00:00.000Z"),
  translations: [
    { locale: "vi", slug: "cau-chuyen-bia" },
    { locale: "en", slug: "the-beer-story" },
  ],
};

/** Just the pathname of every entry, for terse assertions. */
function paths(entries: { url: string }[]): string[] {
  return entries.map((entry) => new URL(entry.url).pathname);
}

describe("sitemap", () => {
  beforeEach(() => {
    listPublished.mockReset();
    listPublished.mockResolvedValue({ items: [post] });
  });

  it("lists every static marketing route in both locales", async () => {
    const entries = await sitemap();
    const found = paths(entries);

    // /contact, /privacy and /terms were reachable but never announced —
    // only / and /blog were in the sitemap before.
    for (const path of ["/", "/blog", "/contact", "/privacy", "/terms", "/menu", "/about"]) {
      expect(found).toContain(path);
      expect(found).toContain(path === "/" ? "/en/" : `/en${path}`);
    }
  });

  it("does not list pages it has asked robots not to index", async () => {
    const found = paths(await sitemap());

    // Listing a noindex page is a conflicting signal, not a neutral one.
    expect(found).not.toContain("/age-verification");
    expect(found).not.toContain("/design-system");
  });

  it("gives the homepage the top priority and a crawl frequency", async () => {
    const home = (await sitemap()).find(
      (entry) => new URL(entry.url).pathname === "/"
    );

    expect(home?.priority).toBe(1);
    expect(home?.changeFrequency).toBe("weekly");
    expect(home?.lastModified).toBeInstanceOf(Date);
  });

  it("declares language alternates on static routes", async () => {
    const contact = (await sitemap()).find(
      (entry) => new URL(entry.url).pathname === "/contact"
    );

    expect(contact?.alternates?.languages).toMatchObject({
      vi: expect.stringMatching(/\/contact$/),
      en: expect.stringMatching(/\/en\/contact$/),
    });
  });

  it("emits one entry per blog translation, keyed to that language's own slug", async () => {
    const found = paths(await sitemap());

    expect(found).toContain("/blog/cau-chuyen-bia");
    expect(found).toContain("/en/blog/the-beer-story");
  });

  it("cross-links a post's translations as alternates of each other", async () => {
    const entry = (await sitemap()).find((e) =>
      e.url.endsWith("/blog/cau-chuyen-bia")
    );

    expect(entry?.alternates?.languages).toMatchObject({
      vi: expect.stringMatching(/\/blog\/cau-chuyen-bia$/),
      en: expect.stringMatching(/\/en\/blog\/the-beer-story$/),
    });
  });

  it("still serves the static routes when the database is unreachable", async () => {
    listPublished.mockRejectedValue(new Error("no db"));

    const found = paths(await sitemap());

    expect(found).toContain("/");
    expect(found).toContain("/contact");
  });
});
