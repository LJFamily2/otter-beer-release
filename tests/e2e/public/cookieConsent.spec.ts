import { test, expect, type Page } from "@playwright/test";

/** Theme tokens from src/app/globals.css. */
const THEME = {
  primary: "rgb(0, 40, 103)", // --color-primary  #002867
  primaryContainer: "rgb(29, 63, 130)", // --color-primary-container #1d3f82
  onPrimary: "rgb(255, 255, 255)", // --color-on-primary #ffffff
  mahogany: "rgb(52, 16, 18)", // --color-mahogany #341012 (must NOT appear)
};

const CONSENT_KEY = "otter_beer_cookie_consent";

/** vi is the default locale and carries no URL prefix. */
const COPY = {
  vi: {
    path: "/privacy",
    banner: "Lựa Chọn Riêng Tư Của Bạn",
    settings: "Tùy Chỉnh",
    reject: "Chỉ Cookie Cần Thiết",
    acceptAll: "Chấp Nhận Tất Cả",
    modal: /tùy chọn cookie/i,
    save: "Lưu Tùy Chọn",
    cancel: "Hủy",
    analytics: "Cookie Phân Tích",
    marketing: "Cookie Tiếp Thị",
    alwaysActive: /luôn bật/i,
  },
  en: {
    path: "/en/privacy",
    banner: "Your Privacy Choice",
    settings: "Settings",
    reject: "Reject Non-Essential",
    acceptAll: "Accept All",
    modal: /cookie preferences/i,
    save: "Save Preferences",
    cancel: "Cancel",
    analytics: "Analytics Cookies",
    marketing: "Marketing Cookies",
    alwaysActive: /always active/i,
  },
} as const;

const banner = (page: Page, label: string) =>
  page.getByRole("region", { name: label });

const readConsent = (page: Page) =>
  page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }, CONSENT_KEY);

/**
 * The banner lives in the marketing layout; /privacy renders it without the
 * home page's data fetching, keeping these assertions fast and isolated.
 */
const openFresh = async (page: Page, locale: keyof typeof COPY) => {
  const copy = COPY[locale];
  await page.goto(copy.path);
  // Age gate is pre-satisfied by the global storageState; only clear consent.
  await page.evaluate((key) => localStorage.removeItem(key), CONSENT_KEY);
  await page.reload();
  await expect(banner(page, copy.banner)).toBeVisible();
  return copy;
};

test.describe("Cookie Consent E2E", () => {
  test.describe("essential cookies copy", () => {
    test("explains the age check and the cookie choice, not authentication", async ({
      page,
    }) => {
      const copy = await openFresh(page, "en");
      await banner(page, copy.banner)
        .getByRole("button", { name: copy.settings })
        .click();

      const dialog = page.getByRole("dialog", { name: copy.modal });
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText(/age confirmation/i);
      await expect(dialog).toContainText(/cookie choice/i);
      await expect(dialog).toContainText(/can't be switched off/i);

      // Session cookies exist only for admins behind /admin.
      await expect(dialog).not.toContainText(/authentication/i);
      await expect(dialog).not.toContainText(/security/i);
    });

    test("keeps essential always active with only two toggles", async ({
      page,
    }) => {
      const copy = await openFresh(page, "en");
      await banner(page, copy.banner)
        .getByRole("button", { name: copy.settings })
        .click();

      const dialog = page.getByRole("dialog", { name: copy.modal });
      await expect(dialog.getByText(copy.alwaysActive)).toBeVisible();
      await expect(dialog.getByRole("checkbox")).toHaveCount(2);
    });
  });

  test.describe("localization", () => {
    test("renders Vietnamese copy on the default locale", async ({ page }) => {
      const copy = await openFresh(page, "vi");
      const region = banner(page, copy.banner);

      await expect(
        region.getByRole("heading", { name: copy.banner })
      ).toBeVisible();
      await expect(
        region.getByRole("button", { name: copy.acceptAll })
      ).toBeVisible();
      await expect(
        region.getByRole("link", { name: /chính sách bảo mật/i })
      ).toHaveAttribute("href", "/privacy");
    });

    test("renders the Vietnamese modal and saves from it", async ({ page }) => {
      const copy = await openFresh(page, "vi");
      await banner(page, copy.banner)
        .getByRole("button", { name: copy.settings })
        .click();

      const dialog = page.getByRole("dialog", { name: copy.modal });
      await expect(dialog).toContainText(/xác nhận độ tuổi/i);
      await expect(dialog).not.toContainText(/xác thực/i);

      await dialog.getByRole("checkbox", { name: copy.analytics }).uncheck();
      await dialog.getByRole("button", { name: copy.save }).click();

      await expect(banner(page, copy.banner)).toBeHidden();
      expect(await readConsent(page)).toEqual({
        essential: true,
        analytics: false,
        marketing: false,
      });
    });

    test("renders English copy under the /en prefix with a prefixed privacy link", async ({
      page,
    }) => {
      const copy = await openFresh(page, "en");

      await expect(
        banner(page, copy.banner).getByRole("link", { name: /privacy policy/i })
      ).toHaveAttribute("href", "/en/privacy");
    });
  });

  test.describe("theme colors", () => {
    test("'Accept All' renders in the navy theme color, not mahogany red", async ({
      page,
    }) => {
      const copy = await openFresh(page, "vi");
      const acceptAll = banner(page, copy.banner).getByRole("button", {
        name: copy.acceptAll,
      });

      const styles = await acceptAll.evaluate((el) => {
        const computed = getComputedStyle(el);
        return { background: computed.backgroundColor, color: computed.color };
      });

      expect(styles.background).toBe(THEME.primary);
      expect(styles.background).not.toBe(THEME.mahogany);
      expect(styles.color).toBe(THEME.onPrimary);
    });

    test("'Accept All' hovers to the primary container shade", async ({
      page,
      isMobile,
    }) => {
      test.skip(!!isMobile, "hover states do not apply on touch devices");

      const copy = await openFresh(page, "vi");
      const acceptAll = banner(page, copy.banner).getByRole("button", {
        name: copy.acceptAll,
      });
      await acceptAll.hover();

      await expect
        .poll(async () =>
          acceptAll.evaluate((el) => getComputedStyle(el).backgroundColor)
        )
        .toBe(THEME.primaryContainer);
    });

    test("secondary actions stay unfilled so 'Accept All' is the only solid CTA", async ({
      page,
    }) => {
      const copy = await openFresh(page, "vi");
      const region = banner(page, copy.banner);

      for (const name of [copy.settings, copy.reject]) {
        const background = await region
          .getByRole("button", { name })
          .evaluate((el) => getComputedStyle(el).backgroundColor);

        expect(background).not.toBe(THEME.primary);
        expect(background).not.toBe(THEME.mahogany);
      }
    });

    test("the settings modal CTA matches the banner CTA color", async ({
      page,
    }) => {
      const copy = await openFresh(page, "vi");
      await banner(page, copy.banner)
        .getByRole("button", { name: copy.settings })
        .click();

      const dialog = page.getByRole("dialog", { name: copy.modal });
      await expect(dialog).toBeVisible();

      const background = await dialog
        .getByRole("button", { name: copy.save })
        .evaluate((el) => getComputedStyle(el).backgroundColor);

      expect(background).toBe(THEME.primary);
    });
  });

  test.describe("consent actions", () => {
    test("'Accept All' persists full consent and dismisses the banner", async ({
      page,
    }) => {
      const copy = await openFresh(page, "vi");
      await banner(page, copy.banner)
        .getByRole("button", { name: copy.acceptAll })
        .click();

      await expect(banner(page, copy.banner)).toBeHidden();
      expect(await readConsent(page)).toEqual({
        essential: true,
        analytics: true,
        marketing: true,
      });

      await page.reload();
      await expect(banner(page, copy.banner)).toBeHidden();
    });

    test("'Reject Non-Essential' still keeps essential on", async ({ page }) => {
      const copy = await openFresh(page, "vi");
      await banner(page, copy.banner)
        .getByRole("button", { name: copy.reject })
        .click();

      await expect(banner(page, copy.banner)).toBeHidden();
      expect(await readConsent(page)).toEqual({
        essential: true,
        analytics: false,
        marketing: false,
      });
    });

    test("settings modal saves the toggled preferences", async ({ page }) => {
      const copy = await openFresh(page, "en");
      await banner(page, copy.banner)
        .getByRole("button", { name: copy.settings })
        .click();

      const dialog = page.getByRole("dialog", { name: copy.modal });
      await dialog.getByRole("checkbox", { name: copy.analytics }).uncheck();
      await dialog.getByRole("checkbox", { name: copy.marketing }).check();
      await dialog.getByRole("button", { name: copy.save }).click();

      await expect(dialog).toBeHidden();
      expect(await readConsent(page)).toEqual({
        essential: true,
        analytics: false,
        marketing: true,
      });
    });

    test("cancelling the modal stores nothing and keeps the banner up", async ({
      page,
    }) => {
      const copy = await openFresh(page, "en");
      await banner(page, copy.banner)
        .getByRole("button", { name: copy.settings })
        .click();

      const dialog = page.getByRole("dialog", { name: copy.modal });
      await dialog.getByRole("button", { name: copy.cancel }).click();

      await expect(dialog).toBeHidden();
      await expect(banner(page, copy.banner)).toBeVisible();
      expect(await readConsent(page)).toBeNull();
    });

    test("banner controls are keyboard reachable with a visible focus ring", async ({
      page,
    }) => {
      const copy = await openFresh(page, "vi");
      const region = banner(page, copy.banner);
      const acceptAll = region.getByRole("button", { name: copy.acceptAll });

      // Tab from Settings → Reject → Accept All so the browser treats the focus
      // as keyboard-driven and :focus-visible applies.
      await region.getByRole("button", { name: copy.settings }).focus();
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      await expect(acceptAll).toBeFocused();

      // `transition-colors` animates outline-color, so poll past the transition.
      await expect
        .poll(async () =>
          acceptAll.evaluate((el) => getComputedStyle(el).outlineColor)
        )
        .toBe(THEME.primary);

      await page.keyboard.press("Enter");
      await expect(banner(page, copy.banner)).toBeHidden();
    });
  });
});
