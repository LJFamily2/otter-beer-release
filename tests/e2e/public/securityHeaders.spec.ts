import { test, expect } from "@playwright/test";

/**
 * HTTP security headers.
 *
 * docs/security.md sections 3 and 8 specified all of these and both ended with
 * "not yet wired" - next.config.ts carried only `images.remotePatterns`, so the
 * production site shipped with no CSP, nothing stopping /admin being framed,
 * and no HSTS.
 *
 * Asserted against the raw response, because a header is only real if it is on
 * the wire. Note the E2E server runs `next dev`, so this suite checks the
 * headers that are identical in both modes; the dev-only and production-only
 * differences (unsafe-eval, websockets, HSTS, upgrade-insecure-requests) are
 * covered exhaustively in tests/unit/lib/securityHeaders.test.ts.
 */

/** Splits a CSP header into directive -> values. */
function parseCsp(csp: string): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const part of csp.split(";")) {
    const [name, ...values] = part.trim().split(/\s+/);
    if (name) out[name] = values;
  }
  return out;
}

const PATHS = ["/", "/blog", "/contact", "/en", "/privacy"];

test.describe("security headers", () => {
  test("serves a Content-Security-Policy on the homepage", async ({ request }) => {
    const response = await request.get("/");

    expect(response.status()).toBe(200);
    expect(response.headers()["content-security-policy"]).toBeTruthy();
  });

  for (const path of PATHS) {
    test("sets the core headers on " + path, async ({ request }) => {
      const headers = (await request.get(path)).headers();

      expect(headers["x-content-type-options"]).toBe("nosniff");
      expect(headers["x-frame-options"]).toBe("DENY");
      expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
      expect(headers["permissions-policy"]).toContain("camera=()");
    });
  }

  test("forbids framing, which is what protects /admin from clickjacking", async ({
    request,
  }) => {
    const header =
      (await request.get("/admin/dang-nhap")).headers()["content-security-policy"] ?? "";

    expect(parseCsp(header)["frame-ancestors"]).toEqual(["'none'"]);
  });

  test("locks down base-uri, form-action and object-src", async ({ request }) => {
    const csp = parseCsp(
      (await request.get("/")).headers()["content-security-policy"] ?? ""
    );

    expect(csp["base-uri"]).toEqual(["'self'"]);
    expect(csp["form-action"]).toEqual(["'self'"]);
    expect(csp["object-src"]).toEqual(["'none'"]);
  });

  test("allows the Google Maps frame the contact page actually embeds", async ({
    request,
  }) => {
    const csp = parseCsp(
      (await request.get("/contact")).headers()["content-security-policy"] ?? ""
    );

    expect(csp["frame-src"]).toContain("https://www.google.com");
  });

  test("covers static assets in public/, not just page routes", async ({ request }) => {
    const headers = (await request.get("/images/otter-beer-og.png")).headers();

    expect(headers["x-content-type-options"]).toBe("nosniff");
  });

  test("does not break the pages it protects - no CSP violations on the homepage", async ({
    page,
  }) => {
    const violations: string[] = [];
    page.on("console", (msg) => {
      const text = msg.text();
      if (/Content Security Policy|Refused to (load|execute|connect)/i.test(text)) {
        violations.push(text);
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    expect(violations).toEqual([]);
  });

  test("does not break the contact page's embedded map", async ({ page }) => {
    const violations: string[] = [];
    page.on("console", (msg) => {
      if (/Refused to frame/i.test(msg.text())) violations.push(msg.text());
    });

    await page.goto("/contact");
    await expect(
      page.locator('iframe[src*="google.com/maps/embed"]')
    ).toBeAttached();

    expect(violations).toEqual([]);
  });
});
