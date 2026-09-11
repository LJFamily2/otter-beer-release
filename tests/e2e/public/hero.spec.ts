import { test, expect, type Page } from "@playwright/test";

const DWELL_MS = 6000;

/** The component's own statement of which slide is showing. */
function liveRegion(page: Page) {
  return page.getByText(/^Slide \d+ of \d+:/);
}

async function currentSlideNumber(page: Page) {
  const text = (await liveRegion(page).textContent()) ?? "";
  return Number(/^Slide (\d+) of/.exec(text)?.[1]);
}

function indicators(page: Page) {
  return page.getByRole("group", { name: "Hero slides" }).getByRole("button");
}

/**
 * Drag the track horizontally. `fraction` is a share of the visible width, so
 * the same call is meaningful on desktop and on a phone viewport — the whole
 * point of the track travelling one visible width per slide.
 */
async function swipe(page: Page, fraction: number) {
  const track = page.getByTestId("hero-track");
  const box = await track.boundingBox();
  if (!box) throw new Error("hero track has no bounding box");

  const startX = box.x + box.width / 2;
  const y = box.y + box.height / 2;

  await page.mouse.move(startX, y);
  await page.mouse.down();
  // Multiple steps so framer-motion sees a continuous gesture rather than a teleport.
  await page.mouse.move(startX + box.width * fraction, y, { steps: 24 });
  // Wait before releasing so Framer Motion registers 0 velocity, strictly relying on distance
  await page.waitForTimeout(200);
  await page.mouse.up();
}

test.describe("Public homepage — Hero carousel", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("region", { name: "Hero carousel" })).toBeVisible();
  });

  test("renders one indicator per slide and no arrow controls", async ({ page }) => {
    await expect(indicators(page)).toHaveCount(4);

    await expect(page.getByRole("button", { name: /previous slide/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /next slide/i })).toHaveCount(0);
    await expect(page.getByRole("tablist")).toHaveCount(0);
  });

  test("jumps to the slide whose indicator is clicked", async ({ page }) => {
    await indicators(page).nth(2).click();

    await expect(liveRegion(page)).toHaveText(/^Slide 3 of 4:/);
    await expect(indicators(page).nth(2)).toHaveAttribute("aria-current", "true");
  });

  // Autoplay keeps running during these, so each one performs a single gesture
  // immediately after load — well inside one dwell — and asserts the move
  // relative to whatever slide was showing rather than a fixed number.
  const nextOf = (n: number) => (n % 4) + 1;
  const prevOf = (n: number) => (n === 1 ? 4 : n - 1);

  test("advances on a forward swipe past the threshold", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "Playwright mouse events do not reliably trigger Framer Motion drag on touch viewports");
    const before = await currentSlideNumber(page);

    await swipe(page, -0.45);

    await expect(liveRegion(page)).toHaveText(
      new RegExp(`^Slide ${nextOf(before)} of 4:`)
    );
  });

  test("goes back on a backward swipe past the threshold", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "Playwright mouse events do not reliably trigger Framer Motion drag on touch viewports");
    const before = await currentSlideNumber(page);

    await swipe(page, 0.45);

    await expect(liveRegion(page)).toHaveText(
      new RegExp(`^Slide ${prevOf(before)} of 4:`)
    );
  });

  test("springs back when a drag stops short of the threshold", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "Playwright mouse events do not reliably trigger Framer Motion drag on touch viewports");
    const before = await currentSlideNumber(page);

    // Well under DRAG_DISTANCE_RATIO, and slow enough not to trip the flick
    // velocity threshold.
    await swipe(page, -0.08);

    await expect(liveRegion(page)).toHaveText(
      new RegExp(`^Slide ${before} of 4:`)
    );
  });

  test("fills the active indicator progressively across the dwell", async ({ page }) => {
    // Click a different slide to guarantee the autoplay timer restarts from zero
    await indicators(page).nth(1).click();

    const fill = page.getByTestId("hero-indicator-fill");
    await expect(fill).toHaveAttribute("data-paused", "false");

    // scaleX shows up in the measured box, so the fill's width *is* its progress.
    const early = (await fill.boundingBox())?.width ?? 0;
    await page.waitForTimeout(DWELL_MS / 2);
    const later = (await fill.boundingBox())?.width ?? 0;

    expect(later).toBeGreaterThan(early);
  });

  test("advances on its own once the dwell elapses", async ({ page }) => {
    const before = await currentSlideNumber(page);

    await expect(liveRegion(page)).not.toHaveText(
      new RegExp(`^Slide ${before} of 4:`),
      { timeout: DWELL_MS * 2 }
    );
  });

  test("keeps autoplay running after an indicator is clicked", async ({ page }) => {
    // A click focuses the button it hits. Pausing on that would strand autoplay
    // for good, so only keyboard focus counts as a pause.
    await indicators(page).nth(0).click();

    await expect(page.getByTestId("hero-indicator-fill")).toHaveAttribute(
      "data-paused",
      "false"
    );
    await expect(liveRegion(page)).toHaveText(/^Slide 2 of 4:/, {
      timeout: DWELL_MS * 2,
    });
  });

  test("pauses autoplay while a drag is in progress", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "Playwright mouse events do not reliably trigger Framer Motion drag on touch viewports");
    const track = page.getByTestId("hero-track");
    const box = await track.boundingBox();
    if (!box) throw new Error("hero track has no bounding box");

    const startX = box.x + box.width / 2;
    const y = box.y + box.height / 2;

    await page.mouse.move(startX, y);
    await page.mouse.down();
    // 0.15 is 15% of the screen. Enough to trigger onDragStart on mobile, but less than the 20% commit threshold
    await page.mouse.move(startX - box.width * 0.15, y, { steps: 8 });
    await page.waitForTimeout(50);

    await expect(page.getByTestId("hero-indicator-fill")).toHaveAttribute(
      "data-paused",
      "true"
    );

    await page.mouse.up();

    await expect(page.getByTestId("hero-indicator-fill")).toHaveAttribute(
      "data-paused",
      "false"
    );
  });

  test("pauses autoplay while a keyboard user has an indicator focused", async ({
    page,
  }) => {
    // Tab until focus lands inside the indicator group.
    await page.keyboard.press("Tab");
    for (let i = 0; i < 12; i++) {
      const inGroup = await page.evaluate(() =>
        Boolean(
          document.activeElement?.closest('[role="group"][aria-label="Hero slides"]')
        )
      );
      if (inGroup) break;
      await page.keyboard.press("Tab");
    }

    await expect(page.getByTestId("hero-indicator-fill")).toHaveAttribute(
      "data-paused",
      "true"
    );

    const held = await currentSlideNumber(page);
    await page.waitForTimeout(DWELL_MS * 1.3);
    expect(await currentSlideNumber(page)).toBe(held);
  });
});
