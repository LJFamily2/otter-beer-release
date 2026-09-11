import { test, expect, type Page } from "@playwright/test";

/**
 * Cookie consent must actually govern analytics.
 *
 * Before this, CookieConsent wrote preferences to localStorage that nothing
 * read, while <GoogleAnalytics> loaded unconditionally - "Reject
 * Non-Essential" dismissed the banner and changed nothing.
 *
 * These run in a real browser, which is the only place the ordering guarantee
 * (deny-by-default registered before gtag.js) can genuinely be observed.
 */

/** Consent tuples pushed onto the GA dataLayer, filtered by default/update. */
async function consentEntries(page: Page, kind: "default" | "update") {
  return page.evaluate((k) => {
    const layer = (window as unknown as { dataLayer?: unknown[] }).dataLayer ?? [];
    return layer
      .map((entry) => {
        const asArray = Array.from(entry as ArrayLike<unknown>);
        return asArray[0] === "consent" && asArray[1] === k
          ? (asArray[2] as Record<string, string>)
          : null;
      })
      .filter(Boolean) as Record<string, string>[];
  }, kind);
}

const REJECT = /chỉ cookie cần thiết|reject non-essential/i;
const ACCEPT = /chấp nhận tất cả|accept all/i;
const BANNER = /lựa chọn riêng tư|your privacy choice/i;

/**
 * No per-test reset is needed or wanted here. Playwright gives each test a
 * fresh context seeded from the shared storageState, which sets only
 * `otter_age_verified` — the consent key is absent, so every test already
 * starts as an undecided visitor.
 *
 * An addInitScript that cleared the key would run on EVERY navigation,
 * including the reloads the persistence tests perform, and would silently
 * destroy the very state those tests exist to verify.
 */
test.describe("cookie consent", () => {
  test("shows the banner to a visitor who has not chosen yet", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("region", { name: BANNER })).toBeVisible();
  });

  test("registers a deny-by-default state before any tag can store anything", async ({
    page,
  }) => {
    await page.goto("/");

    const hasGaTag = await page.locator("#google-consent-mode-default").count();

    // GA is optional (NEXT_PUBLIC_GA_ID). When it is unset there is deliberately
    // no tag and no bootstrap to assert on - skipping beats a false pass.
    test.skip(
      hasGaTag === 0,
      "NEXT_PUBLIC_GA_ID not set in this environment - no GA tag to gate"
    );

    const defaults = await consentEntries(page, "default");
    expect(defaults).toHaveLength(1);
    expect(defaults[0].analytics_storage).toBe("denied");
    expect(defaults[0].ad_storage).toBe("denied");
  });

  test("pushes a DENIED update when the visitor rejects non-essential cookies", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: REJECT }).click();

    const updates = await consentEntries(page, "update");
    expect(updates.at(-1)?.analytics_storage).toBe("denied");
    expect(updates.at(-1)?.ad_storage).toBe("denied");
  });

  test("pushes a GRANTED update on accept-all", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: ACCEPT }).click();

    const updates = await consentEntries(page, "update");
    expect(updates.at(-1)?.analytics_storage).toBe("granted");
    expect(updates.at(-1)?.ad_personalization).toBe("granted");
  });

  test("never writes a _ga cookie for a visitor who rejected analytics", async ({
    page,
    context,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: REJECT }).click();
    await page.waitForTimeout(1500); // let any tag that was going to fire, fire

    const cookies = await context.cookies();

    expect(cookies.filter((c) => c.name.startsWith("_ga"))).toEqual([]);
  });

  test("keeps the choice after a reload instead of re-asking", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: REJECT }).click();

    await page.reload();

    await expect(page.getByRole("region", { name: BANNER })).toHaveCount(0);
  });

  test("replays a stored decision into Consent Mode on a later visit", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: ACCEPT }).click();

    await page.reload();

    // ConsentSync is what makes this pass - without it a returning visitor
    // would sit on the denied default forever, since the banner never returns.
    //
    // Polled rather than read once: ConsentSync replays the decision from a
    // useEffect, so the push lands only after hydration. A single read passes
    // on an idle machine and fails under parallel load, which is exactly the
    // flake this suite must not have.
    await expect
      .poll(
        async () => (await consentEntries(page, "update")).at(-1)?.analytics_storage,
        { message: "ConsentSync should replay the stored grant after hydration" }
      )
      .toBe("granted");
  });
});
