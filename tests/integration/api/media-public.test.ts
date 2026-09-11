/**
 * @jest-environment node
 *
 * NextRequest/Response depend on the Fetch API globals, which the project's
 * default jest-environment-jsdom doesn't provide — Next.js Route Handler
 * tests need the Node environment (Node 18+'s built-in fetch globals).
 */

jest.mock("@/auth", () => ({ auth: jest.fn() }));

/**
 * Pass-through, so these tests exercise the route's real gate rather than
 * Next's data cache. What the cache buys (skipping the repository round-trips
 * on a warm key) is Next's behaviour to guarantee, not this route's; what the
 * route owns is the *order* of the checks and the headers it picks, which is
 * what is asserted below.
 */
jest.mock("next/cache", () => ({
  unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

jest.mock("@/lib/storage/StorageService", () => ({
  storageService: { getObject: jest.fn() },
}));

/**
 * The route instantiates its four repositories at module scope, and jest
 * hoists `jest.mock` above the imports that trigger that — so the factories
 * must not read `isKeyPubliclyVisible` while it is still in its temporal dead
 * zone. Each stub forwards through an arrow instead, deferring the read until
 * a test actually calls the handler.
 */
const isKeyPubliclyVisible = jest.fn();
jest.mock("@/repositories/BlogPostRepository", () => ({
  BlogPostRepository: jest.fn(() => ({
    isKeyPubliclyVisible: (key: string) => isKeyPubliclyVisible(key),
  })),
}));
jest.mock("@/repositories/BeerRepository", () => ({
  BeerRepository: jest.fn(() => ({
    isKeyPubliclyVisible: (key: string) => isKeyPubliclyVisible(key),
  })),
}));
jest.mock("@/repositories/BrandStoryRepository", () => ({
  BrandStoryRepository: jest.fn(() => ({
    isKeyPubliclyVisible: (key: string) => isKeyPubliclyVisible(key),
  })),
}));
jest.mock("@/repositories/HeroSectionRepository", () => ({
  HeroSectionRepository: jest.fn(() => ({
    isKeyPubliclyVisible: (key: string) => isKeyPubliclyVisible(key),
  })),
}));

import { NextRequest } from "next/server";
import { GET } from "@/app/api/media/public/[...key]/route";
import { auth } from "@/auth";
import { storageService } from "@/lib/storage/StorageService";

const KEY = "hero/2026-08-27/abc.jpg";

function request() {
  return new NextRequest(`http://localhost/api/media/public/${KEY}`);
}

function context() {
  return { params: Promise.resolve({ key: KEY.split("/") }) };
}

function storedObject() {
  (storageService.getObject as jest.Mock).mockResolvedValue({
    body: new Uint8Array([1, 2, 3]),
    contentType: "image/jpeg",
  });
}

function grantAdminSession() {
  (auth as jest.Mock).mockResolvedValue({
    user: { permissions: { news_blog: { view: true } } },
  });
}

describe("GET /api/media/public/[...key]", () => {
  beforeEach(() => {
    (auth as jest.Mock).mockResolvedValue(null);
    storedObject();
  });

  afterEach(() => jest.clearAllMocks());

  describe("published media", () => {
    beforeEach(() => isKeyPubliclyVisible.mockResolvedValue(true));

    it("serves the bytes", async () => {
      const res = await GET(request(), context());

      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("image/jpeg");
    });

    /**
     * The regression this route was slow for: `auth()` used to run on every
     * request, putting NextAuth on the critical path of every image on the
     * site even though public traffic never carries a session cookie.
     */
    it("does not call auth() — public traffic never touches NextAuth", async () => {
      await GET(request(), context());

      expect(auth).not.toHaveBeenCalled();
    });

    it("is cacheable by the CDN for a year", async () => {
      const res = await GET(request(), context());

      expect(res.headers.get("Cache-Control")).toBe(
        "public, max-age=31536000, immutable"
      );
    });
  });

  describe("unpublished media", () => {
    beforeEach(() => isKeyPubliclyVisible.mockResolvedValue(false));

    it("404s an anonymous visitor", async () => {
      const res = await GET(request(), context());

      expect(res.status).toBe(404);
    });

    it("falls back to the admin gate", async () => {
      grantAdminSession();

      const res = await GET(request(), context());

      expect(auth).toHaveBeenCalled();
      expect(res.status).toBe(200);
    });

    /**
     * A shared CDN keys on the URL alone. Marking an admin's preview of a
     * draft `public` would let that edge hand the draft to everyone who
     * requested the same URL afterwards.
     */
    it("keeps an admin preview out of shared caches", async () => {
      grantAdminSession();

      const res = await GET(request(), context());

      expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    });
  });

  it("404s when the object is missing from storage", async () => {
    isKeyPubliclyVisible.mockResolvedValue(true);
    (storageService.getObject as jest.Mock).mockResolvedValue(null);

    const res = await GET(request(), context());

    expect(res.status).toBe(404);
  });
});
