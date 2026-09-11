import { test, expect } from "@playwright/test";

/**
 * No authenticated-admin fixture exists in this repo yet (docs/testing.md's
 * `tests/e2e/fixtures/` storageState pattern is aspirational — see
 * tests/e2e/admin/auth.spec.ts, beers.spec.ts and brandStory.spec.ts, none
 * of which has one). Coverage here mirrors those: the RBAC gate on the page
 * and the API, since that's the part reachable without a real Google OAuth
 * session.
 *
 * TODO: test — the full "admin uploads a 16:9 image/video -> slide is saved
 * -> published slide's media becomes publicly fetchable" round trip needs an
 * authenticated-admin session fixture and a storage stub, neither of which
 * is wired up yet. The pieces are covered at the unit level instead:
 * HeroSlidesForm.test.tsx (slide list, per-slide status, payload),
 * MediaUploadField.test.tsx (image/video preview, the 16:9 warning),
 * uploadMedia.test.ts (namespacing and the per-type size caps), and
 * HeroSectionService.test.ts (published-slide filtering).
 */
test.describe("Admin Hero Section — access control", () => {
  test("redirects unauthenticated access to the login page", async ({ page }) => {
    await page.goto("/admin/hero");
    await expect(page).toHaveURL(/\/admin\/dang-nhap/);
  });

  test("callbackUrl is preserved through the redirect to login", async ({ page }) => {
    await page.goto("/admin/hero");
    const url = new URL(page.url());
    expect(url.pathname).toBe("/admin/dang-nhap");
    expect(url.searchParams.get("callbackUrl")).toBe("/admin/hero");
  });

  test("the hero page is not reachable from the public marketing site", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('a[href="/admin/hero"]')).toHaveCount(0);
  });
});

test.describe("Hero Section API — access control", () => {
  test("GET /api/hero-section is refused without a session", async ({ request }) => {
    const response = await request.get("/api/hero-section");
    expect(response.ok()).toBe(false);
    expect([401, 403, 404]).toContain(response.status());
  });

  test("PUT /api/hero-section is refused without a session", async ({ request }) => {
    const response = await request.put("/api/hero-section", {
      data: {
        slides: [
          {
            mediaKey: "hero/e2e/should-never-be-written.jpg",
            mediaType: "image",
            status: "published",
            translations: [{ locale: "vi", alt: "E2E" }],
          },
        ],
      },
    });
    expect(response.ok()).toBe(false);
    expect([401, 403, 404]).toContain(response.status());
  });

  test("an unauthenticated request cannot mint a hero upload URL", async ({ request }) => {
    const response = await request.post("/api/media/upload-url", {
      data: { contentType: "video/mp4", namespace: "hero" },
    });
    expect(response.ok()).toBe(false);
    expect([401, 403, 404]).toContain(response.status());
  });
});

/**
 * What matters here is that a guessed key is never *disclosed* — the route
 * only serves bytes for a key it can prove belongs to published content (for
 * the hero, a slide whose own status is "published"). The status code differs
 * by environment: 404 when the visibility lookup can reach the database, 500
 * when it cannot. Asserting on `ok()` covers the security property in both,
 * rather than passing only where a test database happens to be provisioned.
 */
test.describe("Hero media proxy — public visibility", () => {
  test("an unreferenced hero key is not served to anonymous visitors", async ({
    request,
  }) => {
    const response = await request.get(
      "/api/media/public/hero/2026-01-01/definitely-not-a-real-key.jpg"
    );
    expect(response.ok()).toBe(false);
    expect(response.headers()["content-type"] ?? "").not.toContain("image/");
  });

  test("a guessed video key is not served either", async ({ request }) => {
    const response = await request.get(
      "/api/media/public/hero/2026-01-01/definitely-not-a-real-key.mp4"
    );
    expect(response.ok()).toBe(false);
    expect(response.headers()["content-type"] ?? "").not.toContain("video/");
  });
});
