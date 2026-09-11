/**
 * HTTP security headers and the Content Security Policy, as pure builders.
 *
 * docs/security.md §3 and §8 both specified these and both ended with "not
 * yet wired" — next.config.ts carried only `images.remotePatterns`, so the
 * site shipped with no CSP, no clickjacking defence and no HSTS. This module
 * is the implementation those sections described, kept as data-returning
 * functions so the policy can be asserted in unit tests instead of only being
 * observable by booting a server and reading response headers.
 *
 * ── On the absence of a nonce ──────────────────────────────────────────────
 * Next's own CSP guide reaches for a per-request nonce generated in proxy.ts.
 * That is the stronger policy, and it is deliberately not what this does: a
 * nonce has to be read through `headers()` during render, which opts every
 * page into dynamic rendering. This is a marketing site whose entire premise
 * (see CLAUDE.md, docs/seo.md) is statically-rendered HTML that a crawler or
 * an answer engine gets without executing anything — trading that away for a
 * stricter script-src is the wrong trade here.
 *
 * So script-src carries 'unsafe-inline', which Next needs for its own
 * bootstrap scripts and which @next/third-parties needs for the GA snippet.
 * The XSS surface this leaves is narrow and covered elsewhere: the only
 * attacker-influenced HTML on the site is blog post content, and that is
 * DOMPurify-sanitised on write with no bypass path (see HtmlSanitizer). The
 * directives that actually stop clickjacking, base-tag hijacking, form
 * exfiltration and plugin injection — frame-ancestors, base-uri, form-action,
 * object-src — are all strict and lose nothing to the missing nonce.
 */

export interface CspOptions {
  /**
   * Development needs two extra allowances React and Next only use locally:
   * 'unsafe-eval' (React's dev-mode error reconstruction) and websocket
   * connect-src (HMR). Neither is emitted in production.
   */
  isDev?: boolean;
}

/** Google Tag Manager / GA4 endpoints used by @next/third-parties. */
const GA_SCRIPT = ["https://www.googletagmanager.com"];
const GA_CONNECT = [
  "https://www.googletagmanager.com",
  "https://www.google-analytics.com",
  "https://*.google-analytics.com",
  "https://*.analytics.google.com",
];
const GA_IMG = [
  "https://www.googletagmanager.com",
  "https://www.google-analytics.com",
  "https://*.google-analytics.com",
];

/** The Google Maps embed on /contact is the only third-party frame we allow. */
const MAPS_FRAME = ["https://www.google.com"];

/** Admin avatars come straight from Google's CDN — see next.config.ts. */
const AVATAR_IMG = ["https://lh3.googleusercontent.com"];

export function buildContentSecurityPolicy({ isDev = false }: CspOptions = {}): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // See the module docstring for why 'unsafe-inline' rather than a nonce.
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      ...(isDev ? ["'unsafe-eval'"] : []),
      ...GA_SCRIPT,
    ],
    // Tailwind v4 and next/font both emit inline <style>; there is no
    // hash-stable subset of them to allowlist instead.
    "style-src": ["'self'", "'unsafe-inline'"],
    // next/font/google self-hosts its files at build time, so no
    // fonts.gstatic.com entry is needed here — adding one would be cargo cult.
    "font-src": ["'self'", "data:"],
    "img-src": ["'self'", "data:", "blob:", ...AVATAR_IMG, ...GA_IMG],
    "connect-src": [
      "'self'",
      "https://api.cloudinary.com",
      ...(isDev ? ["ws:", "wss:"] : []),
      ...GA_CONNECT,
    ],
    "frame-src": MAPS_FRAME,
    "media-src": ["'self'", "blob:", "data:"],
    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
    // Clickjacking: the admin panel must never be framable. Paired with the
    // X-Frame-Options header below for browsers that predate frame-ancestors.
    "frame-ancestors": ["'none'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
  };

  const serialized = Object.entries(directives)
    .map(([directive, values]) => `${directive} ${values.join(" ")}`)
    .join("; ");

  // Valueless directive, so it is appended rather than mapped above. Skipped
  // in dev because the dev server is plain http and upgrading breaks it.
  return isDev ? serialized : `${serialized}; upgrade-insecure-requests`;
}

export interface SecurityHeader {
  key: string;
  value: string;
}

/**
 * The non-CSP headers from docs/security.md §8.
 *
 * HSTS is omitted in development: sending it over http is ignored by browsers,
 * but a stray `max-age` picked up from a localhost proxy pins the whole
 * `localhost` origin to https for two years and is painful to unstick.
 */
export function buildSecurityHeaders({ isDev = false }: CspOptions = {}): SecurityHeader[] {
  const headers: SecurityHeader[] = [
    { key: "Content-Security-Policy", value: buildContentSecurityPolicy({ isDev }) },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
    },
    { key: "X-DNS-Prefetch-Control", value: "on" },
  ];

  if (!isDev) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    });
  }

  return headers;
}
