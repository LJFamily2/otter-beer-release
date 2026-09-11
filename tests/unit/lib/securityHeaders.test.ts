import {
  buildContentSecurityPolicy,
  buildSecurityHeaders,
} from "@/lib/security/headers";

/** Pulls one directive's value list out of a serialized CSP string. */
function directive(csp: string, name: string): string[] {
  const found = csp
    .split(";")
    .map((part) => part.trim())
    .find((part) => part === name || part.startsWith(`${name} `));
  if (!found) return [];
  return found.split(/\s+/).slice(1);
}

const headerValue = (isDev: boolean, key: string) =>
  buildSecurityHeaders({ isDev }).find((h) => h.key === key)?.value;

describe("buildContentSecurityPolicy", () => {
  const prod = buildContentSecurityPolicy({ isDev: false });

  describe("attack-surface directives", () => {
    it("forbids being framed at all, which is what stops /admin clickjacking", () => {
      expect(directive(prod, "frame-ancestors")).toEqual(["'none'"]);
    });

    it("blocks plugin/object injection", () => {
      expect(directive(prod, "object-src")).toEqual(["'none'"]);
    });

    it("pins base-uri so an injected <base> cannot re-root every relative URL", () => {
      expect(directive(prod, "base-uri")).toEqual(["'self'"]);
    });

    it("restricts form-action so an injected form cannot post offsite", () => {
      expect(directive(prod, "form-action")).toEqual(["'self'"]);
    });

    it("falls back to a self-only default-src", () => {
      expect(directive(prod, "default-src")).toEqual(["'self'"]);
    });
  });

  describe("third parties the site genuinely uses", () => {
    it("allows the GA tag to load but nothing else scriptable", () => {
      const scriptSrc = directive(prod, "script-src");
      expect(scriptSrc).toContain("https://www.googletagmanager.com");
      expect(scriptSrc).toEqual(
        expect.not.arrayContaining(["*", "https:", "http:"])
      );
    });

    it("allows GA measurement beacons through connect-src", () => {
      const connectSrc = directive(prod, "connect-src");
      expect(connectSrc).toContain("https://www.google-analytics.com");
      expect(connectSrc).toContain("https://*.analytics.google.com");
    });

    it("allows Cloudinary API through connect-src for media uploads", () => {
      const connectSrc = directive(prod, "connect-src");
      expect(connectSrc).toContain("https://api.cloudinary.com");
    });

    it("allows exactly one framed origin — the Google Maps embed on /contact", () => {
      expect(directive(prod, "frame-src")).toEqual(["https://www.google.com"]);
    });

    it("allows Google-hosted admin avatars, matching next.config remotePatterns", () => {
      expect(directive(prod, "img-src")).toContain(
        "https://lh3.googleusercontent.com"
      );
    });

    it("does not allowlist a font CDN, because next/font self-hosts at build time", () => {
      expect(directive(prod, "font-src")).toEqual(["'self'", "data:"]);
      expect(prod).not.toContain("fonts.gstatic.com");
    });
  });

  describe("development-only allowances", () => {
    const dev = buildContentSecurityPolicy({ isDev: true });

    it("permits unsafe-eval in dev for React's error reconstruction", () => {
      expect(directive(dev, "script-src")).toContain("'unsafe-eval'");
    });

    it("never ships unsafe-eval to production", () => {
      expect(directive(prod, "script-src")).not.toContain("'unsafe-eval'");
    });

    it("permits websockets in dev for HMR, but not in production", () => {
      expect(directive(dev, "connect-src")).toContain("ws:");
      expect(directive(prod, "connect-src")).not.toContain("ws:");
    });

    it("upgrades insecure requests only in production, where the dev server is http", () => {
      expect(prod).toContain("upgrade-insecure-requests");
      expect(dev).not.toContain("upgrade-insecure-requests");
    });
  });

  it("serializes as directives separated by '; '", () => {
    expect(prod).toMatch(/^default-src 'self'; /);
    expect(prod).not.toContain(";;");
    expect(prod).not.toContain("\n");
  });
});

describe("buildSecurityHeaders", () => {
  it("emits every header docs/security.md §8 specifies", () => {
    const keys = buildSecurityHeaders({ isDev: false }).map((h) => h.key);

    expect(keys).toEqual(
      expect.arrayContaining([
        "Content-Security-Policy",
        "X-Content-Type-Options",
        "X-Frame-Options",
        "Referrer-Policy",
        "Permissions-Policy",
        "Strict-Transport-Security",
      ])
    );
  });

  it("sets nosniff", () => {
    expect(headerValue(false, "X-Content-Type-Options")).toBe("nosniff");
  });

  it("denies framing for browsers predating frame-ancestors", () => {
    expect(headerValue(false, "X-Frame-Options")).toBe("DENY");
  });

  it("leaks no path or query to third-party origins", () => {
    expect(headerValue(false, "Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin"
    );
  });

  it("switches off camera, microphone and geolocation entirely", () => {
    const policy = headerValue(false, "Permissions-Policy") ?? "";
    expect(policy).toContain("camera=()");
    expect(policy).toContain("microphone=()");
    expect(policy).toContain("geolocation=()");
  });

  it("sends a two-year preloadable HSTS max-age in production", () => {
    const hsts = headerValue(false, "Strict-Transport-Security") ?? "";
    expect(hsts).toContain("max-age=63072000");
    expect(hsts).toContain("includeSubDomains");
    expect(hsts).toContain("preload");
  });

  it("omits HSTS in development so localhost is never pinned to https", () => {
    expect(headerValue(true, "Strict-Transport-Security")).toBeUndefined();
  });

  it("returns unique header keys — a duplicate would silently override", () => {
    const keys = buildSecurityHeaders({ isDev: false }).map((h) => h.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
