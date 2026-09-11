import {
  ACCEPT_ALL,
  CONSENT_CHANGED_EVENT,
  CONSENT_STORAGE_KEY,
  DEFAULT_CONSENT_SIGNALS,
  ESSENTIAL_ONLY,
  applyConsent,
  consentModeBootstrapScript,
  readStoredConsent,
  toConsentSignals,
  writeStoredConsent,
} from "@/lib/analytics/consent";

type DataLayerWindow = Window & { dataLayer?: unknown[] };

const dataLayer = () => (window as DataLayerWindow).dataLayer ?? [];

/** The most recent `consent`/`update` tuple pushed onto the dataLayer. */
function lastConsentUpdate(): Record<string, string> | undefined {
  const entries = dataLayer().filter(
    (e): e is [string, string, Record<string, string>] =>
      Array.isArray(e) && e[0] === "consent" && e[1] === "update"
  );
  return entries.at(-1)?.[2];
}

beforeEach(() => {
  localStorage.clear();
  delete (window as DataLayerWindow).dataLayer;
});

describe("toConsentSignals", () => {
  it("denies everything for an essential-only visitor", () => {
    expect(toConsentSignals(ESSENTIAL_ONLY)).toEqual({
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
  });

  it("grants everything for accept-all", () => {
    expect(toConsentSignals(ACCEPT_ALL)).toEqual({
      analytics_storage: "granted",
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
    });
  });

  it("keeps analytics and marketing independent", () => {
    const signals = toConsentSignals({
      essential: true,
      analytics: true,
      marketing: false,
    });

    expect(signals.analytics_storage).toBe("granted");
    expect(signals.ad_storage).toBe("denied");
  });

  it("ties both v2 ad signals to the marketing toggle the banner describes", () => {
    const signals = toConsentSignals({
      essential: true,
      analytics: false,
      marketing: true,
    });

    expect(signals.ad_user_data).toBe("granted");
    expect(signals.ad_personalization).toBe("granted");
  });
});

describe("DEFAULT_CONSENT_SIGNALS", () => {
  it("denies every signal before the visitor has chosen", () => {
    expect(Object.values(DEFAULT_CONSENT_SIGNALS)).toEqual([
      "denied",
      "denied",
      "denied",
      "denied",
    ]);
  });
});

describe("consentModeBootstrapScript", () => {
  const script = consentModeBootstrapScript();

  it("creates the dataLayer and gtag shim before anything else", () => {
    expect(script).toContain("window.dataLayer=window.dataLayer||[]");
    expect(script).toContain("function gtag()");
  });

  it("registers a DEFAULT (not update) consent state", () => {
    expect(script).toContain("'consent','default'");
    expect(script).not.toContain("'consent','update'");
  });

  it("denies analytics storage in the default state", () => {
    expect(script).toContain('"analytics_storage":"denied"');
    expect(script).toContain('"ad_storage":"denied"');
  });

  it("declares wait_for_update so the tag holds for a late decision", () => {
    expect(script).toContain("wait_for_update");
  });

  it("is a single-line snippet safe to inline", () => {
    expect(script).not.toContain("\n");
    expect(script).not.toContain("</script>");
  });

  it("actually executes and leaves a default entry on the dataLayer", () => {
    // window.eval, not bare eval: the snippet's `gtag` helper closes over the
    // bare identifier `dataLayer`, which only resolves to window.dataLayer when
    // the code runs in the window's own global scope — exactly how a browser
    // runs it, and not how a module-scoped eval inside Jest would.
    (window as unknown as { eval(code: string): void }).eval(
      consentModeBootstrapScript()
    );

    const defaults = dataLayer().filter(
      (e) =>
        typeof e === "object" &&
        e !== null &&
        (e as IArguments)[0] === "consent" &&
        (e as IArguments)[1] === "default"
    );
    expect(defaults).toHaveLength(1);
  });
});

describe("readStoredConsent", () => {
  it("returns null when the visitor has made no choice", () => {
    expect(readStoredConsent()).toBeNull();
  });

  it("reads back a stored decision", () => {
    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({ essential: true, analytics: true, marketing: false })
    );

    expect(readStoredConsent()).toEqual({
      essential: true,
      analytics: true,
      marketing: false,
    });
  });

  it("treats malformed JSON as no decision rather than as consent", () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, "{not json");
    expect(readStoredConsent()).toBeNull();
  });

  it("treats a missing analytics flag as no decision — failing closed", () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ essential: true }));
    expect(readStoredConsent()).toBeNull();
  });

  it("coerces a missing marketing flag to false rather than trusting it", () => {
    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({ essential: true, analytics: true })
    );
    expect(readStoredConsent()?.marketing).toBe(false);
  });
});

describe("writeStoredConsent", () => {
  it("persists the decision under the original storage key", () => {
    writeStoredConsent(ACCEPT_ALL);

    expect(JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY) ?? "{}")).toEqual(
      ACCEPT_ALL
    );
  });

  it("pushes a Consent Mode update — the step the old banner never took", () => {
    writeStoredConsent(ACCEPT_ALL);

    expect(lastConsentUpdate()).toEqual({
      analytics_storage: "granted",
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
    });
  });

  it("pushes a DENIED update when the visitor rejects non-essential cookies", () => {
    writeStoredConsent(ESSENTIAL_ONLY);

    expect(lastConsentUpdate()?.analytics_storage).toBe("denied");
  });

  it("notifies listeners with the chosen preferences", () => {
    const listener = jest.fn();
    window.addEventListener(CONSENT_CHANGED_EVENT, listener);

    writeStoredConsent(ESSENTIAL_ONLY);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(
      (listener.mock.calls[0][0] as CustomEvent).detail
    ).toEqual(ESSENTIAL_ONLY);

    window.removeEventListener(CONSENT_CHANGED_EVENT, listener);
  });

  it("still applies consent when localStorage throws (private mode / quota)", () => {
    const setItem = jest
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });

    expect(() => writeStoredConsent(ACCEPT_ALL)).not.toThrow();
    expect(lastConsentUpdate()?.analytics_storage).toBe("granted");

    setItem.mockRestore();
  });
});

describe("applyConsent", () => {
  it("creates the dataLayer when the GA snippet has not run yet", () => {
    applyConsent(ACCEPT_ALL);
    expect(Array.isArray((window as DataLayerWindow).dataLayer)).toBe(true);
  });

  it("appends rather than replacing an existing dataLayer", () => {
    (window as DataLayerWindow).dataLayer = ["pre-existing"];

    applyConsent(ACCEPT_ALL);

    expect(dataLayer()[0]).toBe("pre-existing");
    expect(dataLayer()).toHaveLength(2);
  });
});
