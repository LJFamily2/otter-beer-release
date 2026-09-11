import { test, expect } from "@playwright/test";

test.describe("404 page", () => {
  test("renders the custom Vietnamese 404 for a fully unmatched path", async ({
    page,
  }) => {
    const response = await page.goto("/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Về trang chủ" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Khám phá Blog" })
    ).toBeVisible();
  });

  test("renders the custom English 404 under the /en prefix", async ({
    page,
  }) => {
    const response = await page.goto("/en/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { name: /drained/i })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Return Home" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Browse Our Brews" })
    ).toBeVisible();
  });

  test("renders for an explicit notFound() call (unknown blog slug)", async ({
    page,
  }) => {
    await page.goto("/blog/khong-ton-tai-slug-xyz");
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  });

  test("has no horizontal overflow at this viewport", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");
    const hasOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth
    );
    expect(hasOverflow).toBe(false);
  });
});

// The 500 page (src/app/error.tsx) is a React error boundary that only
// mounts when a page below the root layout throws at render time. There's
// no route in this app that deterministically throws on demand, so it
// isn't covered by E2E — verified manually instead (see docs/component-catalog.md).
// TODO: test — add one if/when a dedicated throwing test route is introduced.
