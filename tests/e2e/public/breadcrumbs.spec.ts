import { test, expect, type APIRequestContext, type Page } from "@playwright/test";

/**
 * Visible breadcrumbs (pre-production checklist item 5).
 *
 * The site already emitted BreadcrumbList JSON-LD on /contact, /blog and
 * /blog/[slug], but rendered no trail a reader could see — the `Breadcrumbs`
 * component was used only in /admin and the design-system gallery. Google's
 * structured-data guidelines expect breadcrumb markup to describe a breadcrumb
 * that is actually on the page, so the markup was both a UX gap and a
 * validity risk.
 *
 * Both now come from a single trail array per page, so these assertions
 * compare what a user sees against what the JSON-LD claims.
 */

/** Names from the page's BreadcrumbList node, in position order. */
async function jsonLdTrail(
  request: APIRequestContext,
  path: string
): Promise<string[]> {
  const html = await (await request.get(path)).text();

  for (const match of html.matchAll(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
  )) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(match[1]);
    } catch {
      continue;
    }
    const graph =
      (parsed as { "@graph"?: Record<string, unknown>[] })["@graph"] ?? [];
    const crumb = graph.find((node) => node["@type"] === "BreadcrumbList") as
      | { itemListElement: { name: string; position: number }[] }
      | undefined;
    if (crumb) {
      return [...crumb.itemListElement]
        .sort((a, b) => a.position - b.position)
        .map((entry) => entry.name);
    }
  }
  return [];
}

const crumbs = (page: Page) =>
  page.getByRole("navigation", { name: /breadcrumb/i }).first();

/**
 * The rendered trail text, joined.
 *
 * `Breadcrumbs` styles its labels with Tailwind's `uppercase`, and innerText
 * reflects the computed text-transform — so the DOM says "TRANG CHỦ" where the
 * JSON-LD says "Trang chủ". Comparisons below upper-case the structured value
 * rather than lower-casing the visible one, so a genuine casing regression in
 * the markup would still be caught.
 */
async function visibleTrailText(page: Page): Promise<string> {
  return (await crumbs(page).locator("li").allInnerTexts()).join(" | ");
}

test.describe("visible breadcrumbs", () => {
  test("renders a trail on the blog index", async ({ page }) => {
    await page.goto("/blog");

    await expect(crumbs(page)).toBeVisible();
    await expect(crumbs(page)).toContainText(/trang chủ/i);
    await expect(crumbs(page)).toContainText(/tin tức/i);
  });

  test("renders a trail on the contact page", async ({ page }) => {
    await page.goto("/contact");

    await expect(crumbs(page)).toBeVisible();
    await expect(crumbs(page)).toContainText(/liên hệ/i);
  });

  test("links back to the homepage from the blog trail", async ({ page }) => {
    await page.goto("/blog");

    await crumbs(page).getByRole("link", { name: /trang chủ/i }).click();

    await expect(page).toHaveURL(/\/$/);
  });

  test("marks the current page with aria-current instead of linking it", async ({
    page,
  }) => {
    await page.goto("/blog");

    const current = crumbs(page).locator('[aria-current="page"]');
    await expect(current).toHaveCount(1);
    await expect(current).toContainText(/tin tức/i);
  });

  test("is present in the server HTML, not injected after hydration", async ({
    request,
  }) => {
    const html = await (await request.get("/blog")).text();
    const dom = html.replace(/<script[\s\S]*?<\/script>/gi, "");

    expect(dom).toContain('aria-label="Breadcrumb"');
  });

  test("visible trail matches the BreadcrumbList JSON-LD on /blog", async ({
    page,
    request,
  }) => {
    const structured = await jsonLdTrail(request, "/blog");
    expect(structured.length).toBeGreaterThan(1);

    await page.goto("/blog");
    const visible = await visibleTrailText(page);

    for (const name of structured) {
      expect(visible).toContain(name.toLocaleUpperCase("vi"));
    }
  });

  test("visible trail matches the BreadcrumbList JSON-LD on /contact", async ({
    page,
    request,
  }) => {
    const structured = await jsonLdTrail(request, "/contact");
    expect(structured.length).toBeGreaterThan(1);

    await page.goto("/contact");
    const visible = await visibleTrailText(page);

    for (const name of structured) {
      expect(visible).toContain(name.toLocaleUpperCase("vi"));
    }
  });

  test("localises the trail on the English routes", async ({ page }) => {
    await page.goto("/en/blog");

    await expect(crumbs(page)).toContainText(/home/i);
    await expect(crumbs(page)).toContainText(/news/i);
  });
});
