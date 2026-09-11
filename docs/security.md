# Security Guide

## Overview

Security is not an afterthought. Every feature in OtterBeer follows these principles by default.
This document is the authoritative reference for all security decisions in the codebase.

---

## 1. Authentication Token Storage — httpOnly Cookies Only

### ❌ Never use `localStorage` or `sessionStorage` for tokens

```javascript
// WRONG — vulnerable to XSS attacks
localStorage.setItem("token", jwt);
```

**Why it's dangerous:** Any JavaScript on the page — including third-party scripts, browser extensions, or XSS payloads — can read `localStorage`. An attacker can exfiltrate your JWT instantly.

### ✅ Always use `httpOnly` Secure cookies

Auth.js (our auth library) handles this automatically. `src/auth.ts` makes it explicit:

```typescript
// src/auth.ts
export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth({
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      },
    },
  },
  // ...
});
```

### CSRF Protection

`SameSite=Lax` prevents cross-site request forgery for most cases.
For admin state-mutation routes (POST/PATCH/DELETE), Auth.js also generates a CSRF token.
Never disable this.

---

## 2. Input Validation with Zod

**All user input must be validated on the server before touching the database.**
Client-side validation is a UX feature, not a security feature.

### Zod Schemas

Defined per-domain in `src/lib/validation/` (`blogPost.ts`, `user.ts`, `role.ts`, `permission.ts`, `media.ts`).

```typescript
// src/lib/validation/blogPost.ts (excerpt)
export const BlogPostTranslationInputSchema = z.object({
  locale: localeEnum,
  title: z.string().trim().min(1).max(200),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/).optional(),
  excerpt: z.string().trim().min(1).max(300),
  content: z.string().min(1),
  seoKeywords: z.array(z.string().trim().max(50)).max(20).default([]),
});
```

### Using Zod in API routes
```typescript
// src/app/api/news-blog/route.ts (excerpt)
const parsed = BlogPostCreateSchema.safeParse(body);
if (!parsed.success) {
  return NextResponse.json(
    { error: "Validation failed", details: parsed.error.flatten() },
    { status: 400 }
  );
}
```

### Validation Rules by Field Type

| Field type | Rules |
|---|---|
| Text | `.trim()`, `min(1)`, `max()` |
| Email | `z.string().email()` |
| Slugs | `/^[a-z0-9-]+$/` regex |
| Enums | `z.enum([...])` — never trust raw strings |
| Arrays | `.max()` to prevent oversized payloads |
| HTML content | Sanitized with DOMPurify on write (see XSS section) |

---

## 3. XSS (Cross-Site Scripting) Prevention

### React's default protection
React automatically escapes JSX output — you get XSS protection for free when you use JSX normally.

### `dangerouslySetInnerHTML` — handle with extreme care
Blog post detail pages render `translations[].content` with `dangerouslySetInnerHTML`. This is only safe because the content is sanitized **before storage**, every time, with no bypass path.

**Enforced in `src/lib/utils/HtmlSanitizer.ts`, called from `BlogPostService` before every create/update:**
```typescript
import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = ["p","h1","h2","h3","h4","strong","em","ul","ol","li",
                "a","blockquote","code","pre","img", /* ... */];
const ALLOWED_ATTR = ["href","src","alt","title","class","target","rel"];

export class HtmlSanitizer {
  static sanitize(html: string): string {
    return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR });
  }
}
```

### Content Security Policy (CSP) — implemented

Built in `src/lib/security/headers.ts` and applied to every route and every
`public/` asset via `headers()` in `next.config.ts`. Asserted in
`tests/unit/lib/securityHeaders.test.ts` (policy shape) and
`tests/e2e/public/securityHeaders.spec.ts` (actually on the wire).

The strict directives, which are the ones that matter most here:

| Directive | Value | Stops |
|---|---|---|
| `frame-ancestors` | `'none'` | Clickjacking the admin panel |
| `object-src` | `'none'` | Plugin/object injection |
| `base-uri` | `'self'` | An injected `<base>` re-rooting every relative URL |
| `form-action` | `'self'` | An injected form posting credentials offsite |
| `default-src` | `'self'` | Everything not explicitly allowed below |

Third parties are allowlisted narrowly and only where the site genuinely uses
them: `googletagmanager.com` in `script-src`, the GA measurement endpoints in
`connect-src`, `https://www.google.com` as the **only** `frame-src` (the Maps
embed on `/contact`), and `lh3.googleusercontent.com` in `img-src` (admin
avatars, matching `next.config.ts`'s `remotePatterns`). There is no
`fonts.gstatic.com` entry because `next/font/google` self-hosts at build time.

**Why there is no nonce.** Next's own CSP guide reaches for a per-request nonce
generated in `proxy.ts`. That is the stronger policy and is deliberately not
what we do: a nonce must be read through `headers()` during render, which opts
every page into dynamic rendering — and this site's entire premise (CLAUDE.md,
`docs/seo.md`) is statically-rendered HTML a crawler gets without executing
anything. So `script-src` carries `'unsafe-inline'`, which Next needs for its
bootstrap scripts and `@next/third-parties` needs for the GA snippet.

That trade is acceptable because the residual XSS surface is narrow and covered
elsewhere: the only attacker-influenced HTML on the site is blog post content,
and that is DOMPurify-sanitised on write with no bypass path (see above). If the
site ever gains a genuinely dynamic, user-content-heavy surface, revisit this
and move to the nonce approach.

`'unsafe-eval'` and `ws:` are added in development only (React's dev-mode error
reconstruction and HMR) and never ship to production.

---

## 4. API Rate Limiting

Every mutation route (news-blog/users/roles/permissions writes, media upload-url, the Auth.js callback) is wrapped in `withRateLimit()` (`src/lib/rate-limit/withRateLimit.ts`), keyed per client IP, rejecting over-limit requests with `429` + a `Retry-After` header.

```typescript
// src/app/api/media/upload-url/route.ts (excerpt)
export const POST = withRateLimit(
  uploadRateLimiter,
  RouteGuard.requireAuth(async (request, _context, session) => { /* ... */ }),
  "media-upload-url"
);
```

**`RateLimiter`** (`src/lib/rate-limit/RateLimiter.ts`) is an in-memory sliding-window counter — deliberately dependency-free, no Redis/Upstash required. The tradeoff: limits are **per server process**, not shared across serverless instances. This is fine for a single-instance deployment or as a baseline; if traffic outgrows one instance, swap `RateLimiter`'s internals for an Upstash-backed implementation (`@upstash/ratelimit` + `@upstash/redis`) — every call site goes through `withRateLimit()`, so nothing above that layer needs to change.

**Current limits** (`src/lib/rate-limit/limiters.ts`):
| Limiter | Limit | Applied to |
|---|---|---|
| `uploadRateLimiter` | 10/min | `POST /api/media/upload-url` |
| `mutationRateLimiter` | 30/min | POST/PATCH/DELETE on news-blog, users, roles, permissions |
| `authRateLimiter` | 20/min | `/api/auth/[...nextauth]` (GET+POST) |

Add `POST /api/contact` to `mutationRateLimiter` (or a dedicated, stricter limiter) once that route is built.

---

## 5. MongoDB Injection Prevention

Mongoose protects against most injection attacks by default, but you must follow these rules:

### ✅ Always use Mongoose schema validation
```typescript
await BlogPostModel.findById(id);
await BlogPostModel.find({ status: "published" });
```

### ❌ Never use raw `$where` or direct query operators from user input
```typescript
// DANGEROUS — user can pass { $gt: "" } to bypass filters
await BlogPostModel.find({ status: req.body.status });

// SAFE — validate first with Zod, then query
const status = z.enum(["draft", "published"]).parse(req.body.status);
await BlogPostModel.find({ status });
```

Every repository (`src/repositories/`) builds queries from typed, validated inputs only — never spreads raw request bodies into a Mongoose filter.

---

## 6. File Upload Security

Media (images everywhere; images **or** video for the hero section) goes straight from the browser to Cloudinary via a short-lived **signed upload**, never through the Next.js server as a request body — see `src/lib/storage/`.

| Check | Rule | Where enforced |
|---|---|---|
| File type | Only `image/jpeg`, `image/png`, `image/webp`, `image/gif` — plus `video/mp4`, `video/webm` for the `hero` namespace alone | `isAllowedMediaContentType` (`src/lib/storage/constants.ts`) + the named Cloudinary upload preset's `Allowed formats`, applied server-side because `upload_preset` is itself part of the signed payload. `POST /api/media/upload-url` additionally rejects a video requested for any namespace outside `VIDEO_ENABLED_NAMESPACES` |
| File size | Maximum 5MB for images, 50MB for video (`maxSizeBytesFor`) | **Not** enforced by Cloudinary before storing (no preset-level max-size option, and eval scripts can't reject uploads) — `uploadMedia.ts` checks the `bytes` Cloudinary's own upload response reports against the cap for that content type and calls `POST /api/media/delete` to purge the object immediately if it's over the cap. Accept-then-verify-then-purge, not R2's true pre-write rejection — a small window exists where an oversized file transiently exists in Cloudinary. |
| Authentication | `add` or `edit` on the module that owns the requested namespace — `news-blog` → `news_blog`, `beers` → `beers`, `brand-story` → `brand_story`, `hero` → `hero_section` | `POST /api/media/upload-url` resolves the namespace through `MODULE_BY_MEDIA_NAMESPACE` (`src/lib/storage/namespaces.ts`) and checks `session.user.permissions` for it. Before namespacing existed every upload was authorized against `news_blog` alone, which locked out editors who had beers/brand-story rights but no blog rights. `POST /api/media/delete` accepts `add`/`edit` on any one of them: it only ever purges a key this same session just minted, which no document references yet. |
| Object key | Random UUID + date prefix under the namespace folder, server-generated | `StorageService.buildMediaKey` — the client never chooses the storage path |
| Storage | Cloudinary | `GET /api/media/public/[...key]` gates *which* keys are disclosed (published content — for the hero, only slides whose own `status` is `published` — or admin preview), then fetches the bytes from Cloudinary server-side and streams them — a direct redirect to Cloudinary's CDN was tried but broke every page using `next/image` (its built-in optimizer won't follow redirects, for SSRF-safety), so this route stays the only door rather than exposing raw Cloudinary URLs to the browser. |

Cloudinary gets type enforcement at the storage layer (via the signed `upload_preset`) — size enforcement is an app-level post-upload check.

---

## 7. Admin Panel Security — Permission Matrix

Role hierarchy has been replaced by a **per-module, per-action permission matrix** (Truy cập/Xem/Thêm/Sửa/Xóa) — see [rbac.md](./rbac.md) for the full design. The old fixed `viewer < editor < super_admin` hierarchy check no longer applies.

### Route Guard — protect every API route
```typescript
// src/lib/auth/RouteGuard.ts (excerpt)
export const POST = RouteGuard.requirePermission(
  MODULE_KEYS.NEWS_BLOG,
  "add",
  async (request, _context, session) => { /* ... */ }
);
```

`RouteGuard` re-reads `session.user.permissions` (computed fresh per-request in `auth.ts`'s `session` callback, not a stale cached claim) on every call — this satisfies "verify role on every write operation" without each route reimplementing the check.

### Proxy — coarse authentication gate only
`src/proxy.ts` (Next.js 16 renamed `middleware.ts` → `proxy.ts`) only checks "is there a logged-in, active session" for `/admin/*`. It intentionally does **not** know about per-module permissions — that's a DB-backed decision left to the page/route layer, per Next's own guidance to verify authorization inside route handlers rather than relying on Proxy alone (see `node_modules/next/dist/docs/.../file-conventions/proxy.md`).

---

## 8. HTTP Security Headers — implemented

`buildSecurityHeaders()` in `src/lib/security/headers.ts`, applied to
`/:path*` by `next.config.ts`. Headers are checked before the filesystem, so
static files in `public/` are covered too, not just page routes.

| Header | Value |
|---|---|
| `Content-Security-Policy` | see §3 |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` (belt-and-braces with `frame-ancestors`, for older browsers) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), interest-cohort=()` |
| `X-DNS-Prefetch-Control` | `on` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` — **production only** |

HSTS is omitted in development on purpose: browsers ignore it over http
anyway, but a stray `max-age` picked up from a localhost proxy pins the whole
`localhost` origin to https for two years and is painful to unstick.

## 8a. Cookie consent governs analytics

`src/lib/analytics/consent.ts` + `src/components/analytics/`.

Google Analytics runs under **Consent Mode v2**: every signal
(`analytics_storage`, `ad_storage`, `ad_user_data`, `ad_personalization`)
starts `denied`, and the banner pushes an `update` when the visitor chooses.
`ConsentSync` replays a stored decision on later visits.

This replaced a real compliance defect, not a missing nicety: the banner used
to write preferences to `localStorage` that nothing ever read, while
`<GoogleAnalytics>` loaded unconditionally from the root layout — so "Reject
Non-Essential" dismissed the banner and changed nothing. Under GDPR and
Vietnam's Decree 13 a control that states a choice it does not honour is an
affirmative misrepresentation, which is worse than having no banner at all.

**Rule: any future tag that sets cookies or an identifier must be registered
through this module — never mounted directly in a layout.**

---

## 9. Environment Variable Security

| Rule | Detail |
|---|---|
| Never commit `.env.local`, `.env.development.local`, `.env.production.local` | Already enforced in `.gitignore` |
| Keep dev and prod credentials in separate files | `MONGODB_URI` is dev-only in `.env.development.local`, prod-only in `.env.production.local` — never the same cluster. See [database-schema.md](./database-schema.md#per-environment-database--storage) |
| No secrets in client code | Only `NEXT_PUBLIC_*` vars reach the browser |
| Rotate secrets regularly | `AUTH_SECRET`, `CLOUDINARY_API_SECRET`, DB password |
| Validate on startup | `src/lib/env.ts` — Zod-parsed, throws on first access if anything required is missing/malformed |

**Server-only validation (already implemented):**
```typescript
// src/lib/env.ts
const envSchema = z.object({
  MONGODB_URI: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  AUTH_GOOGLE_ID: z.string().min(1),
  AUTH_GOOGLE_SECRET: z.string().min(1),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  CLOUDINARY_UPLOAD_PRESET: z.string().min(1),
  // R2_* stayed but is now optional — R2StorageProvider is an inactive fallback
  // ...
});
```

---

## 10. Dependency Security

```bash
# Run before every release
pnpm audit

# Check for known vulnerabilities weekly (add to CI when set up)
```

---

## Security Checklist (per feature)

When adding any new feature that handles user data, answer these:

- [ ] Is all input validated with Zod before hitting the database?
- [ ] Is the route wrapped in `RouteGuard.requirePermission`/`requireAuth`?
- [ ] Is any HTML content sanitized with `HtmlSanitizer` before saving?
- [ ] Is rate limiting applied if this is a public-facing endpoint?
- [ ] Are new environment variables added to `src/lib/env.ts` and `.env.example`?
- [ ] Does `pnpm audit` pass after adding any new dependency?

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Auth.js Security](https://authjs.dev/security)
- [Next.js Security Headers](https://nextjs.org/docs/app/guides/content-security-policy)
- [Zod Documentation](https://zod.dev)
- [Cloudflare R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)
