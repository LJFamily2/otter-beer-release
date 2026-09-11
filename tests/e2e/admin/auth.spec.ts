import { test, expect } from "@playwright/test";

test.describe("Admin authentication gate", () => {
  test("redirects unauthenticated access to the login page", async ({ page }) => {
    await page.goto("/admin/blog");
    await expect(page).toHaveURL(/\/admin\/dang-nhap/);
  });

  test("login page renders the branding and Google sign-in button", async ({
    page,
  }) => {
    await page.goto("/admin/dang-nhap");
    await expect(page.getByRole("heading", { name: "Otter Beer" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /đăng nhập với google/i })
    ).toBeVisible();
  });

  test("login page has no horizontal overflow at this viewport", async ({
    page,
  }) => {
    await page.goto("/admin/dang-nhap");
    const hasOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth
    );
    expect(hasOverflow).toBe(false);
  });

  test("callbackUrl is preserved through the redirect to login", async ({
    page,
  }) => {
    await page.goto("/admin/blog");
    const url = new URL(page.url());
    expect(url.pathname).toBe("/admin/dang-nhap");
    expect(url.searchParams.get("callbackUrl")).toBe("/admin/blog");
  });
});
