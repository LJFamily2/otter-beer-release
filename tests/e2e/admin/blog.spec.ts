import { test, expect } from "@playwright/test";

test.describe("Admin Blog Section — access control", () => {
  test("redirects unauthenticated access to the login page (index)", async ({ page }) => {
    await page.goto("/admin/blog");
    await expect(page).toHaveURL(/\/admin\/dang-nhap/);
  });

  test("redirects unauthenticated access to the login page (new post)", async ({ page }) => {
    await page.goto("/admin/blog/moi");
    await expect(page).toHaveURL(/\/admin\/dang-nhap/);
  });

  test("callbackUrl is preserved through the redirect to login", async ({ page }) => {
    await page.goto("/admin/blog");
    const url = new URL(page.url());
    expect(url.pathname).toBe("/admin/dang-nhap");
    expect(url.searchParams.get("callbackUrl")).toBe("/admin/blog");
  });

  test("the blog page is not reachable from the public marketing site", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('a[href="/admin/blog"]')).toHaveCount(0);
  });
});

test.describe("Blog Section API — access control", () => {
  test("GET /api/news-blog is refused without a session", async ({ request }) => {
    const response = await request.get("/api/news-blog");
    expect(response.ok()).toBe(false);
    expect([401, 403, 404]).toContain(response.status());
  });

  test("POST /api/news-blog is refused without a session", async ({ request }) => {
    const response = await request.post("/api/news-blog", {
      data: {
        title: "Test Post",
        content: "Test Content",
        status: "published",
        locale: "vi",
      },
    });
    expect(response.ok()).toBe(false);
    expect([401, 403, 404]).toContain(response.status());
  });
});
