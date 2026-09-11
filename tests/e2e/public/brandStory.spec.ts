import { test, expect, type Locator, type Page } from "@playwright/test";

/**
 * The desktop book is `hidden lg:block`, so these assertions only make sense
 * on a wide viewport — the mobile project gets its own test at the bottom.
 */
const DESKTOP_ONLY = ({ viewport }: { viewport: { width: number; height: number } | null }) =>
  (viewport?.width ?? 0) < 1024;

const book = (page: Page) =>
  page.getByRole("group", { name: "Cuốn sách câu chuyện thương hiệu" });

/** The book's spread counter is screen-reader-only, so read it, don't look at it. */
const spreadCounter = (page: Page) => book(page).locator('[aria-live="polite"]');

const chapterTabs = (page: Page) => page.getByRole("button", { name: /^Mở chương / });

/** Loads the homepage and parks the book in the middle of the viewport, clear
 *  of the fixed header, so control clicks are not intercepted. */
async function openStory(page: Page, path = "/") {
  await page.goto(path);
  await page.locator("#story").scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    document.querySelector("#story")?.scrollIntoView({ block: "center" });
  });
}

/** Centres a control before clicking it. The header is fixed, so a control
 *  that Playwright scrolls minimally into view lands underneath it. */
async function clickControl(locator: Locator) {
  await locator.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await locator.click();
}

test.describe("Public homepage — Brand Story flipbook", () => {
  test.skip(DESKTOP_ONLY, "The flipbook is desktop-only");

  test("renders the first spread with working arrow controls", async ({ page }) => {
    await openStory(page);

    await expect(page.getByText("CÂU CHUYỆN THƯƠNG HIỆU").first()).toBeVisible();
    await expect(spreadCounter(page)).toHaveText("Trang 1 / 8");
    await expect(book(page).getByRole("button", { name: "Trang trước" })).toBeDisabled();
    await expect(book(page).getByRole("button", { name: "Trang sau" })).toBeEnabled();
  });

  test("flips to the next spread and back via the arrow controls", async ({ page }) => {
    await openStory(page);

    await clickControl(book(page).getByRole("button", { name: "Trang sau" }));
    await expect(spreadCounter(page)).toHaveText("Trang 2 / 8");

    await clickControl(book(page).getByRole("button", { name: "Trang trước" }));
    await expect(spreadCounter(page)).toHaveText("Trang 1 / 8");
  });

  test("disables the next arrow once the last spread is reached", async ({ page }) => {
    await openStory(page);
    const next = book(page).getByRole("button", { name: "Trang sau" });

    for (let i = 0; i < 7; i++) {
      await clickControl(next);
    }

    await expect(spreadCounter(page)).toHaveText("Trang 8 / 8");
    await expect(next).toBeDisabled();
  });

  test("renders under the /en locale with English chrome copy", async ({ page }) => {
    await openStory(page, "/en");

    await expect(page.getByText("BRAND STORY").first()).toBeVisible();
    await expect(
      page.getByRole("group", { name: "Brand story book" }).getByRole("button", { name: "Next page" })
    ).toBeVisible();
  });

  test.describe("chapter tabs are groups of images", () => {
    test("shows one page-edge tab per chapter", async ({ page }) => {
      await openStory(page);

      await expect(chapterTabs(page)).toHaveCount(5);
      await expect(page.getByRole("button", { name: "Mở chương Câu Chuyện" })).toHaveAttribute(
        "aria-current",
        "true"
      );
    });

    test("keeps a 3-image chapter current for two page-turns", async ({ page }) => {
      await openStory(page);
      const next = book(page).getByRole("button", { name: "Trang sau" });

      // "Câu Chuyện" holds 3 images, so one turn must NOT hand over to the next tab.
      await clickControl(next);
      await expect(spreadCounter(page)).toHaveText("Trang 2 / 8");
      await expect(page.getByRole("button", { name: "Mở chương Câu Chuyện" })).toHaveAttribute(
        "aria-current",
        "true"
      );

      // The second turn exhausts the chapter and the next tab takes over.
      await clickControl(next);
      await expect(page.getByRole("button", { name: "Mở chương Nguyên Liệu" })).toHaveAttribute(
        "aria-current",
        "true"
      );
      await expect(page.getByRole("button", { name: "Mở chương Câu Chuyện" })).not.toHaveAttribute("aria-current", "true");
    });

    test("keeps a 4-image chapter current for two page-turns", async ({ page }) => {
      await openStory(page);

      await clickControl(page.getByRole("button", { name: "Mở chương Nấu Bia" }));
      await expect(spreadCounter(page)).toHaveText("Trang 4 / 8");

      await clickControl(book(page).getByRole("button", { name: "Trang sau" }));
      await expect(spreadCounter(page)).toHaveText("Trang 5 / 8");
      await expect(page.getByRole("button", { name: "Mở chương Nấu Bia" })).toHaveAttribute(
        "aria-current",
        "true"
      );

      await clickControl(book(page).getByRole("button", { name: "Trang sau" }));
      await expect(page.getByRole("button", { name: "Mở chương Cộng Đồng" })).toHaveAttribute(
        "aria-current",
        "true"
      );
    });

    test("moves read chapters to the left stack and restores them on the way back", async ({
      page,
    }) => {
      await openStory(page);

      await clickControl(page.getByRole("button", { name: "Mở chương Cộng Đồng" }));
      await expect(page.getByRole("button", { name: "Mở chương Cộng Đồng" })).toHaveAttribute("aria-current", "true");
      await expect(page.getByRole("button", { name: "Mở chương Câu Chuyện" })).not.toHaveAttribute("aria-current", "true");

      await clickControl(book(page).getByRole("button", { name: "Trang trước" }));
      await expect(page.getByRole("button", { name: "Mở chương Nấu Bia" })).toHaveAttribute("aria-current", "true");
    });
  });

  test("plays a page-turn sound on arrow click, but not on page load", async ({ page }) => {
    // Stub the Web Audio API before any app code runs. Real audio can't be
    // observed from Playwright, but the graph being built and started can.
    await page.addInitScript(() => {
      const w = window as unknown as Record<string, unknown>;
      w.__audioStarts = 0;
      const param = () => ({ setValueAtTime() {}, exponentialRampToValueAtTime() {}, value: 0 });
      w.AudioContext = class {
        state = "running";
        currentTime = 0;
        sampleRate = 44100;
        destination = {};
        resume() {}
        createBuffer() {
          return { getChannelData: () => new Float32Array(1024) };
        }
        createBufferSource() {
          return {
            buffer: null,
            connect() {},
            stop() {},
            start() {
              (window as unknown as Record<string, number>).__audioStarts += 1;
            },
          };
        }
        createBiquadFilter() {
          return { type: "", Q: { value: 0 }, frequency: param(), connect() {} };
        }
        createGain() {
          return { gain: param(), connect() {} };
        }
      };
    });

    await openStory(page);
    const startsBefore = await page.evaluate(
      () => (window as unknown as Record<string, number>).__audioStarts
    );
    expect(startsBefore).toBe(0);

    await clickControl(book(page).getByRole("button", { name: "Trang sau" }));

    await expect
      .poll(() => page.evaluate(() => (window as unknown as Record<string, number>).__audioStarts))
      .toBeGreaterThan(0);
  });

  test("has no horizontal overflow at this viewport", async ({ page }) => {
    await openStory(page);
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasOverflow).toBe(false);
  });
});

test.describe("Public homepage — Brand Story on mobile", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) >= 1024, "Mobile layout only");

  test("shows the mobile carousel instead of the flipbook", async ({ page }) => {
    await openStory(page);

    // The desktop book is not part of the mobile experience — mobile has its
    // own separate design, so assert only that the book stays out of its way.
    await expect(page.getByRole("group", { name: "Cuốn sách câu chuyện thương hiệu" })).toBeHidden();
    await expect(page.locator("#story")).toBeVisible();
  });
});
