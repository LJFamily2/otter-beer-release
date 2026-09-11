import { test, expect } from "@playwright/test";

/**
 * SEO / AEO / GEO regressions.
 *
 * These assert against the RAW server response (`request.get`), not the
 * hydrated page, because that is exactly what a crawler or an answer engine
 * sees. A check that runs after hydration would have passed happily while the
 * site was serving 7KB of age gate to Google.
 */

/** The un-hydrated HTML, with <script> blocks removed — what a crawler reads. */
async function crawlableHtml(
  request: import("@playwright/test").APIRequestContext,
  path: string
): Promise<{ html: string; dom: string }> {
  const response = await request.get(path);
  expect(response.status()).toBe(200);
  const html = await response.text();
  const dom = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  return { html, dom };
}

test.describe("crawlable content", () => {
  // No stored age confirmation — the state every crawler arrives in.
  test.use({ storageState: { cookies: [], origins: [] } });

  test("serves the full homepage to an unverified visitor, not just the age gate", async ({
    request,
  }) => {
    const { dom } = await crawlableHtml(request, "/");

    // The gate used to replace the page entirely in the server HTML.
    expect(dom).toContain("<main");
    expect(dom).toContain("<footer");
    expect(dom.length).toBeGreaterThan(30_000);
  });

  test("renders exactly one h1, naming the brand", async ({ request }) => {
    const { dom } = await crawlableHtml(request, "/");
    const h1s = [...dom.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) =>
      m[1].replace(/<[^>]+>/g, "").trim()
    );

    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toMatch(/Otter Beer/i);
    expect(h1s[0]).not.toMatch(/18\+/);
  });

  test("ships the FAQ answers in the HTML, unopened", async ({ request }) => {
    const { dom } = await crawlableHtml(request, "/");

    // AEO: the answers must be readable without running any JavaScript.
    expect(dom).toContain("<details");
    expect(dom).toMatch(/100% mạch nha vàng/);
  });
});

test.describe("structured data", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("emits a real JSON-LD script tag with the brand entity graph", async ({
    request,
  }) => {
    const { html } = await crawlableHtml(request, "/");
    const match = html.match(
      /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i
    );

    // It previously existed only inside the RSC flight payload, escaped as a
    // JSON string — which no crawler parses as structured data.
    expect(match).not.toBeNull();

    const graph = JSON.parse(match![1]);
    expect(graph["@context"]).toBe("https://schema.org");

    const types = (graph["@graph"] as { "@type": string }[]).map(
      (node) => node["@type"]
    );
    expect(types).toEqual(
      expect.arrayContaining(["Organization", "WebSite", "Brewery", "FAQPage"])
    );
  });

  test("carries a canonical and an x-default hreflang on both locales", async ({
    request,
  }) => {
    for (const path of ["/", "/en"]) {
      const { html } = await crawlableHtml(request, path);

      expect(html).toMatch(/<link rel="canonical"/i);
      expect(html).toMatch(/hrefLang="x-default"/i);
    }
  });

  test("does not render the brand name twice in the homepage title", async ({
    request,
  }) => {
    const { html } = await crawlableHtml(request, "/");
    const title = html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? "";

    expect(title).toMatch(/Otter Beer/);
    expect(title).not.toMatch(/Otter Beer[\s\S]*Otter Beer/);
  });
});

test.describe("crawler-facing files", () => {
  test("serves robots.txt pointing at the sitemap", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);

    const body = await response.text();
    expect(body).toMatch(/Sitemap:.*sitemap\.xml/);
    expect(body).toMatch(/Disallow: \/admin/);
    // GEO: the answer-engine crawlers are admitted by name.
    expect(body).toMatch(/GPTBot/);
    expect(body).toMatch(/ClaudeBot/);
  });

  test("serves a sitemap listing every static route with alternates", async ({
    request,
  }) => {
    // The proxy used to rewrite /sitemap.xml to /vi/sitemap.xml, so this 404'd.
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);

    const xml = await response.text();
    for (const path of ["/blog", "/contact", "/privacy", "/terms"]) {
      expect(xml).toContain(`<loc>`);
      expect(xml).toMatch(new RegExp(`${path}<`));
    }
    expect(xml).toMatch(/hreflang="x-default"/);
  });

  test("serves llms.txt with the brand facts", async ({ request }) => {
    const response = await request.get("/llms.txt");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toMatch(/text\/plain/);

    const body = await response.text();
    expect(body).toContain("# Otter Beer");
    expect(body).toContain("BADENBEER");
    expect(body).toMatch(/Frequently asked questions/);
  });
});
