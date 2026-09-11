import { GoogleAnalytics } from "@next/third-parties/google";
import { consentModeBootstrapScript } from "@/lib/analytics/consent";
import { ConsentSync } from "./ConsentSync";

interface AnalyticsProps {
  /** GA4 measurement ID. When absent nothing is rendered at all. */
  gaId?: string;
}

/**
 * Google Analytics, gated behind Consent Mode v2.
 *
 * Order is the entire point, and is why this is one component rather than two
 * loose tags in the layout:
 *
 *  1. A plain inline <script> sets every consent signal to "denied" and
 *     declares `wait_for_update`, so gtag.js is told the rules before it
 *     exists.
 *  2. <GoogleAnalytics> loads gtag.js, which now starts in the denied state —
 *     cookieless pings only, no _ga identifier written.
 *  3. <ConsentSync> replays a returning visitor's stored decision, and the
 *     banner pushes an `update` the moment a new one is made.
 *
 * Get that order wrong and there is a window in which the tag believes it is
 * unrestricted, which is exactly the bug this replaces.
 *
 * ── Why a raw <script> and not next/script ────────────────────────────────
 * The obvious reach is `<Script strategy="beforeInteractive">`, but Next
 * requires that strategy to live literally inside app/layout.tsx (see
 * node_modules/next/dist/docs/.../components/script.md), which a shared
 * component cannot satisfy — the ESLint rule that flags it is correct.
 *
 * A plain inline script is the better tool anyway: it is in the server HTML
 * and executes the moment the parser reaches it, whereas gtag.js is injected
 * by @next/third-parties with `afterInteractive`, i.e. after hydration. The
 * ordering therefore holds by construction rather than by strategy, and it is
 * exactly the shape Google's own Consent Mode documentation prescribes.
 */
export function Analytics({ gaId }: AnalyticsProps) {
  if (!gaId) return null;

  return (
    <>
      <script
        id="google-consent-mode-default"
        // Static, self-authored string built in src/lib/analytics/consent.ts.
        // No user input reaches it.
        dangerouslySetInnerHTML={{ __html: consentModeBootstrapScript() }}
      />
      <GoogleAnalytics gaId={gaId} />
      <ConsentSync />
    </>
  );
}
