import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { SUPPORTED_LOCALE_CODES, DEFAULT_LOCALE } from "@/config/locales";

/**
 * NOTE: Next.js 16 renamed the `middleware.ts` file convention to
 * `proxy.ts` (functionally identical, see node_modules/next/dist/docs/
 * .../file-conventions/proxy.md). Do not rename this back to middleware.ts.
 */

const PUBLIC_ADMIN_PATHS = ["/admin/dang-nhap"];

function isPublicAdminPath(pathname: string): boolean {
  return PUBLIC_ADMIN_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

function matchLocalizedMarketingPath(pathname: string): string | null {
  return (
    SUPPORTED_LOCALE_CODES.find(
      (locale) =>
        pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
    ) ?? null
  );
}

/**
 * Forwards the resolved locale as a request header so the root layout
 * (which sits above the [locale] segment and never receives its params)
 * can set <html lang> correctly — see src/app/layout.tsx.
 */
function withLocaleHeader(request: Request, locale: string): Headers {
  const headers = new Headers(request.headers);
  headers.set("x-locale", locale);
  return headers;
}

/**
 * Marks a request as belonging to the admin section, so src/app/not-found.tsx
 * (which sits above both route trees and can't tell them apart from its own
 * segment) can render admin-appropriate recovery actions instead of links
 * back into the public marketing site — see getServerAppSection.ts.
 */
function withAdminSectionHeader(request: Request): Headers {
  const headers = new Headers(request.headers);
  headers.set("x-app-section", "admin");
  return headers;
}

// This only gates "is there a logged-in user" — it deliberately does not
// check per-module permissions (which admin nav items to show, view/add/
// edit/delete rights). That's a DB-backed, per-request decision made by the
// admin layout/pages and by RouteGuard on API routes; see
// node_modules/next/dist/docs/.../file-conventions/proxy.md's guidance to
// verify authorization inside route handlers rather than relying on Proxy
// alone.
export default auth((request) => {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (isPublicAdminPath(pathname) || request.auth?.user?.id) {
      return NextResponse.next({
        request: { headers: withAdminSectionHeader(request) },
      });
    }
    const signInUrl = new URL("/admin/dang-nhap", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Marketing site locale routing: vi (default) is served with no prefix.
  const matchedLocale = matchLocalizedMarketingPath(pathname);
  if (matchedLocale) {
    return NextResponse.next({
      request: { headers: withLocaleHeader(request, matchedLocale) },
    });
  }
  return NextResponse.rewrite(
    new URL(`/${DEFAULT_LOCALE}${pathname}`, request.url),
    { request: { headers: withLocaleHeader(request, DEFAULT_LOCALE) } }
  );
});

export const config = {
  // `images` exempts plain files served straight from `public/` (e.g.
  // /images/*.jpg) — without this they get rewritten to /vi/images/*.jpg
  // by the locale-routing fallback below and 404, since that rewrite only
  // makes sense for actual [locale]-segment page routes, not static assets.
  //
  // The SEO files need the same exemption for the same reason, and did not
  // have it: /sitemap.xml, /robots.txt and /llms.txt live at the root of the
  // app tree, outside the [locale] segment, so the fallback rewrote them to
  // /vi/sitemap.xml etc. and every one of them 404'd. A sitemap a crawler
  // cannot fetch is a sitemap that does not exist.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|sitemap.xml|robots.txt|llms.txt|manifest.webmanifest).*)",
  ],
};
