import { NextResponse, type NextRequest } from "next/server";
import { unstable_cache } from "next/cache";
import { auth } from "@/auth";
import { MODULE_KEYS } from "@/config/permissions";
import { storageService } from "@/lib/storage/StorageService";
import { BlogPostRepository } from "@/repositories/BlogPostRepository";
import { BeerRepository } from "@/repositories/BeerRepository";
import { BrandStoryRepository } from "@/repositories/BrandStoryRepository";
import { HeroSectionRepository } from "@/repositories/HeroSectionRepository";

export const dynamic = "force-dynamic";

const blogPostRepository = new BlogPostRepository();
const beerRepository = new BeerRepository();
const brandStoryRepository = new BrandStoryRepository();
const heroSectionRepository = new HeroSectionRepository();

/**
 * How long a resolved published/unpublished verdict is reused before the four
 * repositories are asked again.
 *
 * This is not the media's cache lifetime — that is the `Cache-Control` below,
 * and it is already effectively permanent. Un-publishing a post has never
 * pulled an already-delivered image back out of the CDN or a browser cache,
 * because object keys are immutable and the response is marked `immutable`.
 * So this window only bounds how long a *newly* published image can 404 for,
 * and how long a freshly un-published one keeps being re-served to cold edges.
 */
const VISIBILITY_TTL_SECONDS = 300;

/**
 * Is this object key referenced by something *published*?
 *
 * The uncached form of this is four `countDocuments` round-trips to Mongo, and
 * on a cold function it also pays the mongoose connection handshake. That was
 * measured at ~500ms per image request against production — the dominant cost
 * of serving an image, an order of magnitude more than fetching the bytes from
 * Cloudinary (~50ms). Since it is asked for the same immutable keys over and
 * over, it is cached: a warm answer serves an image with zero DB traffic.
 */
const isKeyPubliclyVisible = unstable_cache(
  async (key: string): Promise<boolean> => {
    const visibility = await Promise.all([
      blogPostRepository.isKeyPubliclyVisible(key),
      beerRepository.isKeyPubliclyVisible(key),
      brandStoryRepository.isKeyPubliclyVisible(key),
      heroSectionRepository.isKeyPubliclyVisible(key),
    ]);
    return visibility.some(Boolean);
  },
  ["media-public-visibility"],
  { revalidate: VISIBILITY_TTL_SECONDS, tags: ["media-public-visibility"] },
);

interface RouteParams {
  params: Promise<{ key: string[] }>;
}

/**
 * Media endpoint behind a dual gate — images and, for the hero section,
 * video — access control needs to serve two
 * different audiences the same way regardless of which storage provider is
 * active:
 *  1. Public visitors: only media actually referenced by a *published*
 *     post/beer/hero slide (fast, cacheable, crawlable — required for
 *     SEO/social previews).
 *  2. Logged-in admins with view access to any module that owns media:
 *     any key, so the Tiptap editor / BeerForm / HeroSlidesForm can
 *     preview files that aren't published yet.
 * Everything else (orphaned uploads, guesses) 404s either way.
 *
 * ── Order matters ──────────────────────────────────────────────────────────
 * The published-media check runs FIRST and `auth()` runs only if it fails.
 * Public traffic is ~all of this route's traffic and none of it has a session
 * cookie, so calling `auth()` up front bought nothing and put NextAuth on the
 * critical path of every image on the site. Admin previews of not-yet-
 * published keys are the only requests that still reach it.
 *
 * Streams the bytes rather than redirecting to the provider's view URL —
 * a redirect was tried (to let the browser hit Cloudinary's CDN directly)
 * but broke every page using next/image's <Image>: Next's built-in image
 * optimizer fetches `src` server-side and, for SSRF-safety, does not
 * follow redirects, so a 302's empty body was logged as "internal image
 * response is empty" and rendered as a broken image. Streaming is the one
 * response shape that works for both next/image and plain <img> callers
 * (e.g. ImageUploadField's admin preview) — and next/image already does
 * its own resizing/format-negotiation/caching on top of this anyway, so
 * the loss versus a direct CDN redirect is small.
 */
export async function GET(_request: NextRequest, context: RouteParams) {
  const { key: keyParts } = await context.params;
  const key = keyParts.join("/");

  const isPublic = await isKeyPubliclyVisible(key);

  if (!isPublic) {
    const session = await auth();
    const canPreviewAsAdmin = Boolean(
      session?.user?.permissions?.[MODULE_KEYS.NEWS_BLOG]?.view ||
        session?.user?.permissions?.[MODULE_KEYS.BEERS]?.view ||
        session?.user?.permissions?.[MODULE_KEYS.BRAND_STORY]?.view ||
        session?.user?.permissions?.[MODULE_KEYS.HERO_SECTION]?.view
    );
    if (!canPreviewAsAdmin) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  const object = await storageService.getObject(key);
  if (!object) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(Buffer.from(object.body), {
    headers: {
      "Content-Type": object.contentType,
      // Object keys are per-upload random UUIDs (see StorageService.buildImageKey)
      // and never overwritten, so a key's content never changes — safe to
      // cache aggressively at the browser and any CDN in front of this route.
      //
      // Only for media that is actually published, though. A shared CDN keys
      // on the URL alone, so marking an admin's preview of an unpublished key
      // `public` would let that edge serve the draft to everyone who asked for
      // the same URL afterwards. Those responses are kept private instead.
      "Cache-Control": isPublic
        ? "public, max-age=31536000, immutable"
        : "private, no-store",
    },
  });
}
