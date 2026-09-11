import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CookieConsent } from "@/components/ui/CookieConsent";

const STORAGE_KEY = "otter_beer_cookie_consent";

type DataLayerWindow = Window & { dataLayer?: unknown[] };

/** Every `consent`/`update` tuple the banner has pushed for Consent Mode v2. */
const consentUpdates = () =>
  ((window as DataLayerWindow).dataLayer ?? []).filter(
    (e): e is [string, string, Record<string, string>] =>
      Array.isArray(e) && e[0] === "consent" && e[1] === "update"
  );

/** Tailwind class helper — reads the class list off a rendered element. */
const classesOf = (el: HTMLElement) => el.className.split(/\s+/);

const openSettings = async (name: RegExp) => {
  await userEvent.click(await screen.findByRole("button", { name }));
  return screen.getByRole("dialog");
};

describe("CookieConsent Component", () => {
  beforeEach(() => {
    localStorage.clear();
    delete (window as DataLayerWindow).dataLayer;
  });

  describe("visibility", () => {
    it("shows the banner when no consent has been stored", async () => {
      render(<CookieConsent locale="en" />);

      expect(
        await screen.findByRole("region", { name: /your privacy choice/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /your privacy choice/i })
      ).toBeInTheDocument();
    });

    it("stays hidden when consent already exists in storage", () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ essential: true, analytics: true, marketing: true })
      );

      render(<CookieConsent locale="en" />);

      expect(
        screen.queryByRole("region", { name: /your privacy choice/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("essential cookies copy", () => {
    it("describes what a visitor stores — the age check and the cookie choice", async () => {
      render(<CookieConsent locale="en" />);
      const dialog = await openSettings(/settings/i);

      const essential = within(dialog).getByText(/essential cookies/i)
        .parentElement as HTMLElement;

      expect(essential).toHaveTextContent(/age confirmation/i);
      expect(essential).toHaveTextContent(/cookie choice/i);
      expect(essential).toHaveTextContent(/can't be switched off/i);
    });

    it("no longer claims the essential cookies cover authentication or security", async () => {
      render(<CookieConsent locale="en" />);
      const dialog = await openSettings(/settings/i);

      // Sign-in/session cookies only exist for admins behind /admin — naming
      // them here confused visitors about what the always-on row covers.
      expect(dialog).not.toHaveTextContent(/authentication/i);
      expect(dialog).not.toHaveTextContent(/security/i);
    });

    it("keeps the essential row always active with no toggle", async () => {
      render(<CookieConsent locale="en" />);
      const dialog = await openSettings(/settings/i);

      expect(within(dialog).getByText(/always active/i)).toBeInTheDocument();
      expect(within(dialog).getAllByRole("checkbox")).toHaveLength(2);
    });

    it("describes analytics as aggregated and not identifying the visitor", async () => {
      render(<CookieConsent locale="en" />);
      const dialog = await openSettings(/settings/i);

      expect(dialog).toHaveTextContent(/does not identify you/i);
    });
  });

  describe("localization", () => {
    it("renders Vietnamese copy for the default locale", async () => {
      render(<CookieConsent locale="vi" />);

      expect(
        await screen.findByRole("heading", {
          name: /lựa chọn riêng tư của bạn/i,
        })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /chấp nhận tất cả/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /chính sách bảo mật/i })
      ).toHaveAttribute("href", "/privacy");
    });

    it("renders the Vietnamese essential description in the modal", async () => {
      render(<CookieConsent locale="vi" />);
      const dialog = await openSettings(/tùy chỉnh/i);

      expect(dialog).toHaveTextContent(/xác nhận độ tuổi/i);
      expect(dialog).toHaveTextContent(/không thể tắt/i);
      expect(within(dialog).getByText(/luôn bật/i)).toBeInTheDocument();
    });

    it("prefixes the privacy link for non-default locales", async () => {
      render(<CookieConsent locale="en" />);

      expect(
        await screen.findByRole("link", { name: /privacy policy/i })
      ).toHaveAttribute("href", "/en/privacy");
    });

    it("falls back to English for an unknown locale", async () => {
      render(<CookieConsent locale="fr" />);

      expect(
        await screen.findByRole("heading", { name: /your privacy choice/i })
      ).toBeInTheDocument();
    });

    it("defaults to Vietnamese when no locale is passed", async () => {
      render(<CookieConsent />);

      expect(
        await screen.findByRole("heading", {
          name: /lựa chọn riêng tư của bạn/i,
        })
      ).toBeInTheDocument();
    });
  });

  describe("theme colors", () => {
    it("renders the primary 'Accept All' CTA in the navy theme color, not mahogany red", async () => {
      render(<CookieConsent locale="en" />);
      const acceptAll = await screen.findByRole("button", {
        name: /accept all/i,
      });

      expect(classesOf(acceptAll)).toEqual(
        expect.arrayContaining([
          "bg-primary",
          "hover:bg-primary-container",
          "text-on-primary",
        ])
      );
      expect(acceptAll.className).not.toMatch(/mahogany/);
    });

    it("styles the secondary banner actions as outlined, non-filled buttons", async () => {
      render(<CookieConsent locale="en" />);

      const settings = await screen.findByRole("button", { name: /settings/i });
      const reject = screen.getByRole("button", {
        name: /reject non-essential/i,
      });

      // A 10% tint on hover is fine; a solid fill would make it a second CTA.
      expect(classesOf(settings)).not.toContain("bg-primary");
      expect(classesOf(reject)).not.toContain("bg-primary");
    });

    it("gives every banner control a themed focus ring for keyboard users", async () => {
      render(<CookieConsent locale="en" />);
      const banner = await screen.findByRole("region", {
        name: /your privacy choice/i,
      });

      for (const button of within(banner).getAllByRole("button")) {
        expect(button.className).toMatch(/focus-visible:outline-primary/);
      }
    });
  });

  describe("consent actions", () => {
    it("stores full consent when 'Accept All' is clicked and dismisses the banner", async () => {
      render(<CookieConsent locale="en" />);
      await userEvent.click(
        await screen.findByRole("button", { name: /accept all/i })
      );

      expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({
        essential: true,
        analytics: true,
        marketing: true,
      });
      expect(
        screen.queryByRole("region", { name: /your privacy choice/i })
      ).not.toBeInTheDocument();
    });

    it("stores essential-only consent when 'Reject Non-Essential' is clicked", async () => {
      render(<CookieConsent locale="en" />);
      await userEvent.click(
        await screen.findByRole("button", { name: /reject non-essential/i })
      );

      expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({
        essential: true,
        analytics: false,
        marketing: false,
      });
    });

    it("keeps essential true even when only the optional toggles are saved", async () => {
      render(<CookieConsent locale="en" />);
      const dialog = await openSettings(/settings/i);

      await userEvent.click(
        within(dialog).getByRole("checkbox", { name: /analytics cookies/i })
      );
      await userEvent.click(
        within(dialog).getByRole("checkbox", { name: /marketing cookies/i })
      );
      await userEvent.click(
        within(dialog).getByRole("button", { name: /save preferences/i })
      );

      expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({
        essential: true,
        analytics: false,
        marketing: true,
      });
    });

    it("saves from the Vietnamese modal too", async () => {
      render(<CookieConsent locale="vi" />);
      const dialog = await openSettings(/tùy chỉnh/i);

      await userEvent.click(
        within(dialog).getByRole("checkbox", { name: /cookie tiếp thị/i })
      );
      await userEvent.click(
        within(dialog).getByRole("button", { name: /lưu tùy chọn/i })
      );

      expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({
        essential: true,
        analytics: true,
        marketing: true,
      });
    });

    it("closes the modal without storing consent when 'Cancel' is clicked", async () => {
      render(<CookieConsent locale="en" />);
      const dialog = await openSettings(/settings/i);
      await userEvent.click(
        within(dialog).getByRole("button", { name: /cancel/i })
      );

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
      expect(
        screen.getByRole("region", { name: /your privacy choice/i })
      ).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("exposes the settings modal as a labelled modal dialog", async () => {
      render(<CookieConsent locale="en" />);
      const dialog = await openSettings(/settings/i);

      expect(dialog).toHaveAccessibleName(/cookie preferences/i);
      expect(dialog).toHaveAttribute("aria-modal", "true");
    });

    it("labels the close button in the active locale", async () => {
      render(<CookieConsent locale="vi" />);
      const dialog = await openSettings(/tùy chỉnh/i);

      expect(
        within(dialog).getByRole("button", { name: /đóng/i })
      ).toBeInTheDocument();
    });
  });

  describe("enforcing the choice (Google Consent Mode v2)", () => {
    /**
     * The bug this covers: the banner used to write preferences to
     * localStorage and nothing ever read them, while <GoogleAnalytics> loaded
     * unconditionally from the root layout. Clicking "Only essential cookies"
     * dismissed the banner and changed nothing — GA still loaded and still set
     * _ga. A banner that states a choice it does not honour is an affirmative
     * misrepresentation under GDPR and Vietnam's Decree 13, not just a gap.
     */
    it("denies analytics storage when the visitor rejects non-essential cookies", async () => {
      render(<CookieConsent locale="en" />);

      await userEvent.click(
        await screen.findByRole("button", { name: /reject non-essential/i })
      );

      expect(consentUpdates().at(-1)?.[2]).toEqual({
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
    });

    it("grants every signal on accept-all", async () => {
      render(<CookieConsent locale="en" />);

      await userEvent.click(
        await screen.findByRole("button", { name: /accept all/i })
      );

      expect(consentUpdates().at(-1)?.[2]).toEqual({
        analytics_storage: "granted",
        ad_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
      });
    });

    it("persists the rejection so it survives a reload", async () => {
      render(<CookieConsent locale="en" />);

      await userEvent.click(
        await screen.findByRole("button", { name: /reject non-essential/i })
      );

      expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")).toEqual({
        essential: true,
        analytics: false,
        marketing: false,
      });
    });

    it("pushes exactly one consent update per decision", async () => {
      render(<CookieConsent locale="en" />);

      await userEvent.click(
        await screen.findByRole("button", { name: /accept all/i })
      );

      expect(consentUpdates()).toHaveLength(1);
    });

    it("always keeps essential cookies on, whatever the visitor saved", async () => {
      render(<CookieConsent locale="en" />);

      await userEvent.click(
        await screen.findByRole("button", { name: /reject non-essential/i })
      );

      expect(
        JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}").essential
      ).toBe(true);
    });
  });
});
