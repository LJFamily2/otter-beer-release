import { test, expect } from "@playwright/test";

const RAIL = "Danh sách bài viết nổi bật";

test.describe("Public homepage — News & Blog rail", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    const hasNews = (await page.getByText("TIN TỨC & BLOG").count()) > 0;
    test.skip(!hasNews, "Skipping NewsBlog tests because no published blog posts exist in DB");
  });

  test("renders the masthead, the story cards and a link to the blog", async ({
    page,
  }) => {
    await expect(page.getByText("TIN TỨC & BLOG")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "NHẬT KÝ BIA CHÚ RÁI CÁ" })
    ).toBeVisible();

    await expect(
      page.locator('[data-news-card]').first()
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /XEM TẤT CẢ BÀI VIẾT/ })
    ).toHaveAttribute("href", "/blog");
  });

  test.describe("pointer controls", () => {
    // The arrows are pointer-only (hidden below lg) — touch users swipe the
    // rail instead, so these assertions only apply to the desktop project.
    test.skip(({ isMobile }) => !!isMobile, "rail arrows are desktop-only");

    test("starts parked at the first card with the previous arrow disabled", async ({
      page,
    }) => {
      await page.goto("/");

      const rail = page.getByRole("region", { name: RAIL });
      await rail.scrollIntoViewIfNeeded();

      expect(await rail.evaluate((el) => el.scrollLeft)).toBe(0);
      await expect(
        page.getByRole("button", { name: "Bài viết trước" })
      ).toBeDisabled();
      await expect(
        page.getByRole("button", { name: "Bài viết tiếp theo" })
      ).toBeEnabled();
    });

    test("advances the rail one card at a time and disables each end", async ({
      page,
    }) => {
      await page.goto("/");

      const rail = page.getByRole("region", { name: RAIL });
      const prev = page.getByRole("button", { name: "Bài viết trước" });
      const next = page.getByRole("button", { name: "Bài viết tiếp theo" });
      await rail.scrollIntoViewIfNeeded();

      await next.click();
      await expect
        .poll(() => rail.evaluate((el) => el.scrollLeft))
        .toBeGreaterThan(0);
      await expect(prev).toBeEnabled();

      // Walk to the far end — the rail is short enough that a handful of
      // clicks always exhausts it.
      for (let i = 0; i < 6 && !(await next.isDisabled()); i++) {
        await next.click({ force: true });
        await page.waitForTimeout(400);
      }


      await expect(next).toBeDisabled();
      await expect
        .poll(() => rail.evaluate((el) => el.scrollWidth - el.clientWidth - el.scrollLeft))
        .toBeLessThanOrEqual(8);
    });
  });

  test("shows the swipe hint instead of arrows on a touch viewport", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "hint is mobile-only");
    await page.goto("/");

    await expect(page.getByText("Vuốt để xem thêm bài viết")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Bài viết tiếp theo" })
    ).toBeHidden();
  });

  test("renders under the /en locale with English copy and prefixed links", async ({
    page,
  }) => {
    await page.goto("/en");

    await expect(
      page.getByRole("heading", { name: "OTTER BEER JOURNAL" })
    ).toBeVisible();
    await expect(
      page.locator('[data-news-card]').first()
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /VIEW ALL STORIES/ })
    ).toHaveAttribute("href", "/en/blog");
  });
});
