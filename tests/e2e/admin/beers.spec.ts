import { test, expect } from "@playwright/test";

/**
 * No authenticated-admin fixture exists in this repo yet (docs/testing.md's
 * `tests/e2e/fixtures/` storageState pattern is aspirational — see
 * tests/e2e/admin/auth.spec.ts and tests/e2e/admin/brandStory.spec.ts, the
 * only other admin specs, neither of which has one). Coverage here mirrors
 * those: verify the RBAC gate itself, since that's the part reachable
 * without a real Google OAuth session.
 *
 * TODO: test — the full "admin sets a beer's themeColor/themeColorContainer
 * -> homepage ProductShowcase reflects it" round trip needs both an
 * authenticated-admin session fixture and a seeded published-beer fixture,
 * neither of which exists yet. BeerForm's color-field behavior itself is
 * covered at the unit level (tests/unit/components/BeerForm.test.tsx) and
 * ProductShowcase's rendering of themeColor/themeColorContainer is covered
 * in tests/unit/components/ProductShowcase.test.tsx.
 */
test.describe("Admin Beers — access control", () => {
  test("redirects unauthenticated access to the list page to login", async ({ page }) => {
    await page.goto("/admin/beers");
    await expect(page).toHaveURL(/\/admin\/dang-nhap/);
  });

  test("redirects unauthenticated access to the create form to login", async ({ page }) => {
    await page.goto("/admin/beers/moi");
    await expect(page).toHaveURL(/\/admin\/dang-nhap/);
  });

  test("callbackUrl is preserved through the redirect to login", async ({ page }) => {
    await page.goto("/admin/beers");
    const url = new URL(page.url());
    expect(url.pathname).toBe("/admin/dang-nhap");
    expect(url.searchParams.get("callbackUrl")).toBe("/admin/beers");
  });
});
