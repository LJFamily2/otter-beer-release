import { render } from "@testing-library/react";
import { ConsentSync } from "@/components/analytics/ConsentSync";
import {
  ACCEPT_ALL,
  CONSENT_STORAGE_KEY,
  ESSENTIAL_ONLY,
} from "@/lib/analytics/consent";

type DataLayerWindow = Window & { dataLayer?: unknown[] };

const consentUpdates = () =>
  ((window as DataLayerWindow).dataLayer ?? []).filter(
    (e): e is [string, string, Record<string, string>] =>
      Array.isArray(e) && e[0] === "consent" && e[1] === "update"
  );

beforeEach(() => {
  localStorage.clear();
  delete (window as DataLayerWindow).dataLayer;
});

describe("ConsentSync", () => {
  it("renders nothing", () => {
    const { container } = render(<ConsentSync />);
    expect(container).toBeEmptyDOMElement();
  });

  /**
   * Without this replay, a visitor who accepted analytics last month would be
   * measured under the denied default forever: the banner never reappears for
   * them, so nothing else would ever push an update.
   */
  it("replays a stored acceptance into Consent Mode on mount", () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(ACCEPT_ALL));

    render(<ConsentSync />);

    expect(consentUpdates().at(-1)?.[2].analytics_storage).toBe("granted");
  });

  it("replays a stored rejection as denied", () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(ESSENTIAL_ONLY));

    render(<ConsentSync />);

    expect(consentUpdates().at(-1)?.[2].analytics_storage).toBe("denied");
  });

  it("pushes nothing when the visitor has not decided yet", () => {
    render(<ConsentSync />);

    // Silence here matters: the bootstrap default (denied) must stand
    // unchallenged until there is an actual decision to report.
    expect(consentUpdates()).toHaveLength(0);
  });

  it("pushes nothing when the stored value is corrupt", () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, "not-json");

    render(<ConsentSync />);

    expect(consentUpdates()).toHaveLength(0);
  });
});
