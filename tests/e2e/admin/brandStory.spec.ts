import { test, expect } from "@playwright/test";

/**
 * No authenticated-admin fixture exists in this repo yet (docs/testing.md's
 * `tests/e2e/fixtures/` storageState pattern is aspirational — see
 * tests/e2e/admin/auth.spec.ts, the only other admin spec that runs without
 * one). Coverage here mirrors that file: verify the RBAC gate itself, since
 * that's the part reachable without a real Google OAuth session.
 */
test.describe("Admin Brand Story — access control", () => {
  test("redirects unauthenticated access to the login page", async ({ page }) => {
    await page.goto("/admin/brand-story");
    await expect(page).toHaveURL(/\/admin\/dang-nhap/);
  });

  test("callbackUrl is preserved through the redirect to login", async ({ page }) => {
    await page.goto("/admin/brand-story");
    const url = new URL(page.url());
    expect(url.pathname).toBe("/admin/dang-nhap");
    expect(url.searchParams.get("callbackUrl")).toBe("/admin/brand-story");
  });
});
