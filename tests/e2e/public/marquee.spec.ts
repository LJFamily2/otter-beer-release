import { test, expect, type Page } from "@playwright/test";

function region(page: Page) {
  return page.getByRole("region", { name: "Brand Marquee" });
}

function leftTrack(page: Page) {
  return page.getByTestId("marquee-track-left");
}

function rightTrack(page: Page) {
  return page.getByTestId("marquee-track-right");
}

async function transformOf(locator: ReturnType<typeof leftTrack>) {
  return locator.evaluate((el) => window.getComputedStyle(el).transform);
}

test.describe("Public homepage — Brand marquee", () => {
  test("renders both rows with the Vietnamese copy under the default locale", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(region(page)).toBeVisible();
    await expect(region(page).getByText("OTTER BEER").first()).toBeVisible();
    await expect(
      region(page).getByText("HƯƠNG VỊ ĐỊA PHƯƠNG, TRẢI NGHIỆM KHÁC BIỆT").first()
    ).toBeVisible();
  });

  test("renders the English tagline under /en", async ({ page }) => {
    await page.goto("/en");

    await expect(region(page)).toBeVisible();
    await expect(
      region(page).getByText("LOCAL FLAVOR, A DIFFERENT EXPERIENCE").first()
    ).toBeVisible();
  });

  test("repeats each row's text several times for a continuous loop", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(region(page)).toBeVisible();
    await region(page).scrollIntoViewIfNeeded();

    expect(await leftTrack(page).locator(":scope > *").count()).toBeGreaterThan(1);
    expect(await rightTrack(page).locator(":scope > *").count()).toBeGreaterThan(1);
  });

  test("scrolls the two rows continuously", async ({ page }) => {
    await page.goto("/");
    await expect(region(page)).toBeVisible();
    await region(page).scrollIntoViewIfNeeded();

    await page.waitForTimeout(500);
    const before = await transformOf(leftTrack(page));
    await page.waitForTimeout(1000);
    const after = await transformOf(leftTrack(page));

    expect(after).not.toBe(before);
  });

  test("freezes the animation when the user prefers reduced motion", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.waitForTimeout(500); // Wait for hydration of reducedMotion state
    await expect(region(page)).toBeVisible();
    await region(page).scrollIntoViewIfNeeded();

    await page.waitForTimeout(500);
    const before = await transformOf(leftTrack(page));
    await page.waitForTimeout(1000);
    const after = await transformOf(leftTrack(page));

    expect(after).toBe(before);
  });
});
