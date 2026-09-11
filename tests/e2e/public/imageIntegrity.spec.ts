import { test, expect, type Page } from "@playwright/test";

/**
 * Image integrity — pre-production checklist items 13 and 16.
 *
 * Two separate bugs lived here:
 *
 *  13. The OpenGraph card. Metadata declared `width: 1200, height: 630` while
 *      the file was a 1024x1024 square, and /contact pointed at
 *      `contact-hero.jpeg` when the file on disk is `contact-hero.jpg` — a
 *      hard 404 for every scraper that tried to build a preview.
 *  16. Content images shipped `alt=""`, which tells assistive tech and image
 *      search "this picture means nothing". Genuinely decorative images keep
 *      an empty alt on purpose (WCAG H67); the ones carrying meaning no longer
 *      do.
 */

/** Fails the test if any image request on the page returns >= 400. */
function trackFailedImages(page: Page): string[] {
  const failures: string[] = [];
  page.on("response", (response) => {
    const isImage =
      response.request().resourceType() === "image" ||
      /\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(response.url());
    if (isImage && response.status() >= 400) {
      failures.push(`${response.status()} ${response.url()}`);
    }
  });
  return failures;
}

const PAGES = ["/", "/blog", "/contact", "/en"];

test.describe("no broken images", () => {
  for (const path of PAGES) {
    test(`every image on ${path} loads`, async ({ page }) => {
      const failures = trackFailedImages(page);

      await page.goto(path);
      await page.waitForLoadState("networkidle");

      expect(failures).toEqual([]);
    });
  }
});

test.describe("OpenGraph share card", () => {
  test("the declared og:image actually resolves", async ({ request }) => {
    const html = await (await request.get("/")).text();
    const url = /<meta property="og:image" content="([^"]+)"/.exec(html)?.[1];

    expect(url).toBeTruthy();

    const image = await request.get(url as string);
    expect(image.status()).toBe(200);
    expect(image.headers()["content-type"]).toContain("image");
  });

  test("declares the 1200x630 dimensions scrapers trust", async ({ request }) => {
    const html = await (await request.get("/")).text();

    expect(html).toContain('property="og:image:width" content="1200"');
    expect(html).toContain('property="og:image:height" content="630"');
  });

  test("the contact page's own card resolves — it used to 404 on .jpeg", async ({
    request,
  }) => {
    const html = await (await request.get("/contact")).text();
    const url = /<meta property="og:image" content="([^"]+)"/.exec(html)?.[1];

    expect(url).toBeTruthy();
    expect(url).not.toContain(".jpeg");
    expect((await request.get(url as string)).status()).toBe(200);
  });

  test("serves a twitter:card so shared links render large", async ({ request }) => {
    const html = await (await request.get("/")).text();

    expect(html).toContain('name="twitter:card" content="summary_large_image"');
  });
});

test.describe("alt text on content images", () => {
  test("the news rail's post covers describe the post", async ({ page }) => {
    await page.goto("/");

    const cards = page.locator("[data-news-card] img");
    const count = await cards.count();
    test.skip(count === 0, "no published posts in this environment");

    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i)).toHaveAttribute("alt", /\S/);
    }
  });

  test("blog index covers carry descriptive alt text", async ({ page }) => {
    await page.goto("/blog");

    const covers = page.locator("main img, article img");
    const count = await covers.count();
    test.skip(count === 0, "no published posts in this environment");

    // At least one real, non-empty alt — the regression was every cover
    // shipping alt="" across the whole index.
    const alts = await covers.evaluateAll((nodes) =>
      nodes.map((n) => (n as HTMLImageElement).alt)
    );
    expect(alts.some((alt) => alt.trim().length > 0)).toBe(true);
  });

  test("every image has an alt attribute, even the decorative ones", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // A *missing* alt is always a defect; an empty one is a deliberate
    // "decorative" signal and is allowed.
    const missing = await page.locator("img:not([alt])").count();
    expect(missing).toBe(0);
  });
});
