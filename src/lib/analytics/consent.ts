/**
 * Cookie-consent state and its bridge to Google Consent Mode v2.
 *
 * The consent banner used to be decorative: it wrote a preferences object to
 * localStorage and nothing ever read it, while <GoogleAnalytics> loaded
 * unconditionally from the root layout. A visitor who clicked "Only essential
 * cookies" still got gtag.js and still got _ga cookies. A banner that states a
 * choice it does not honour is worse than no banner — under GDPR and Vietnam's
 * Decree 13 it is an affirmative misrepresentation, not merely a gap.
 *
 * This module is the missing half. It is deliberately free of React and of
 * `window` access at module scope so the mapping logic can be unit-tested
 * directly, with the browser-touching helpers guarding on `typeof window`.
 */

export interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

/** Unchanged from the original banner — existing visitors keep their choice. */
export const CONSENT_STORAGE_KEY = "otter_beer_cookie_consent";

/**
 * Fired on `window` after a consent decision so any listener (the analytics
 * component, future embeds) can react without CookieConsent importing them.
 */
export const CONSENT_CHANGED_EVENT = "otter-cookie-consent-changed";

/** Everything off but the cookies the site cannot function without. */
export const ESSENTIAL_ONLY: CookiePreferences = {
  essential: true,
  analytics: false,
  marketing: false,
};

export const ACCEPT_ALL: CookiePreferences = {
  essential: true,
  analytics: true,
  marketing: true,
};

/** Consent Mode v2 signal names, as Google defines them. */
export interface ConsentSignals {
  ad_storage: "granted" | "denied";
  ad_user_data: "granted" | "denied";
  ad_personalization: "granted" | "denied";
  analytics_storage: "granted" | "denied";
}

const grant = (allowed: boolean): "granted" | "denied" =>
  allowed ? "granted" : "denied";

/**
 * Maps our three-checkbox model onto Google's four signals.
 *
 * `ad_user_data` and `ad_personalization` are v2 additions and are tied to the
 * marketing toggle: both govern what may be sent to and inferred by Google's
 * advertising products, which is exactly what "marketing cookies" promises to
 * control in the banner copy.
 */
export function toConsentSignals(preferences: CookiePreferences): ConsentSignals {
  return {
    analytics_storage: grant(preferences.analytics),
    ad_storage: grant(preferences.marketing),
    ad_user_data: grant(preferences.marketing),
    ad_personalization: grant(preferences.marketing),
  };
}

/**
 * The pre-consent default. Everything denied: Consent Mode still lets GA send
 * cookieless pings that Google models into aggregate traffic, so measurement
 * is degraded rather than absent, and no identifier is stored on the device
 * until the visitor says yes.
 */
export const DEFAULT_CONSENT_SIGNALS: ConsentSignals = toConsentSignals(ESSENTIAL_ONLY);

/**
 * The inline snippet that must execute *before* gtag.js loads — the whole
 * point of Consent Mode is that the default arrives first, so the tag never
 * gets a window in which it believes it is allowed to write.
 */
export function consentModeBootstrapScript(): string {
  return [
    "window.dataLayer=window.dataLayer||[];",
    "function gtag(){dataLayer.push(arguments);}",
    `gtag('consent','default',${JSON.stringify({
      ...DEFAULT_CONSENT_SIGNALS,
      wait_for_update: 500,
    })});`,
  ].join("");
}

/** Reads a stored decision. Returns null when the visitor has not chosen yet. */
export function readStoredConsent(): CookiePreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CookiePreferences>;
    // Anything malformed is treated as "no decision" rather than as consent —
    // failing open here would grant analytics off a corrupted string.
    if (typeof parsed?.analytics !== "boolean") return null;
    return {
      essential: true,
      analytics: parsed.analytics,
      marketing: parsed.marketing === true,
    };
  } catch {
    return null;
  }
}

/** Persists the decision and notifies listeners in the same tick. */
export function writeStoredConsent(preferences: CookiePreferences): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // A private-mode/quota failure must not stop the banner dismissing or the
    // consent signal being applied for this page view.
  }
  applyConsent(preferences);
  window.dispatchEvent(
    new CustomEvent<CookiePreferences>(CONSENT_CHANGED_EVENT, { detail: preferences })
  );
}

/** Pushes a Consent Mode `update` for the given preferences. */
export function applyConsent(preferences: CookiePreferences): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as { dataLayer?: unknown[] };
  if (!Array.isArray(w.dataLayer)) w.dataLayer = [];
  // Pushed as a raw arguments-shaped array rather than through gtag() so this
  // works whether or not the bootstrap snippet has defined the helper yet.
  w.dataLayer.push(["consent", "update", toConsentSignals(preferences)]);
}
