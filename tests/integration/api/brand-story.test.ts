/**
 * @jest-environment node
 *
 * NextRequest/Response depend on the Fetch API globals, which the project's
 * default jest-environment-jsdom doesn't provide — Next.js Route Handler
 * tests need the Node environment (Node 18+'s built-in fetch globals).
 */

jest.mock("@/auth", () => ({ auth: jest.fn() }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/services/BrandStoryService", () => ({
  brandStoryService: { get: jest.fn(), replaceChapters: jest.fn() },
}));

import { NextRequest } from "next/server";
import { GET, PUT } from "@/app/api/brand-story/route";
import { auth } from "@/auth";
import { brandStoryService } from "@/services/BrandStoryService";

function grantSession(overrides: Partial<{ view: boolean; edit: boolean }>) {
  (auth as jest.Mock).mockResolvedValue({
    user: {
      id: "user-1",
      permissions: {
        brand_story: {
          access: true,
          view: false,
          add: false,
          edit: false,
          delete: false,
          ...overrides,
        },
      },
    },
  });
}

function putRequest(body: unknown) {
  return new NextRequest("http://localhost/api/brand-story", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

describe("GET /api/brand-story", () => {
  afterEach(() => jest.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    (auth as jest.Mock).mockResolvedValue(null);

    const res = await GET(new NextRequest("http://localhost/api/brand-story"), {});

    expect(res.status).toBe(401);
  });

  it("returns 404 when the session lacks view permission", async () => {
    grantSession({ view: false });

    const res = await GET(new NextRequest("http://localhost/api/brand-story"), {});

    expect(res.status).toBe(404);
  });

  it("returns the current chapters when authorized", async () => {
    grantSession({ view: true });
    (brandStoryService.get as jest.Mock).mockResolvedValue({
      chapters: [{ images: ["k1"], translations: [] }],
    });

    const res = await GET(new NextRequest("http://localhost/api/brand-story"), {});

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.chapters).toHaveLength(1);
  });

  it("returns an empty array when the document has never been saved", async () => {
    grantSession({ view: true });
    (brandStoryService.get as jest.Mock).mockResolvedValue(null);

    const res = await GET(new NextRequest("http://localhost/api/brand-story"), {});

    const body = await res.json();
    expect(body.chapters).toEqual([]);
  });
});

describe("PUT /api/brand-story", () => {
  afterEach(() => jest.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    (auth as jest.Mock).mockResolvedValue(null);

    const res = await PUT(putRequest({ chapters: [] }), {});

    expect(res.status).toBe(401);
  });

  it("returns 404 when the session lacks edit permission", async () => {
    grantSession({ view: true, edit: false });

    const res = await PUT(putRequest({ chapters: [] }), {});

    expect(res.status).toBe(404);
  });

  it("returns 400 for an invalid payload", async () => {
    grantSession({ view: true, edit: true });

    const res = await PUT(putRequest({ chapters: [{ images: [], translations: [] }] }), {});

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.details).toBeDefined();
  });

  it("replaces the chapters and returns 200 for a valid payload", async () => {
    grantSession({ view: true, edit: true });
    const chapter = {
      images: ["k1"],
      translations: [{ locale: "vi", title: "Our Story" }],
    };
    (brandStoryService.replaceChapters as jest.Mock).mockResolvedValue({ chapters: [chapter] });

    const res = await PUT(putRequest({ chapters: [chapter] }), {});

    expect(res.status).toBe(200);
    expect(brandStoryService.replaceChapters).toHaveBeenCalledWith({ chapters: [chapter] }, "user-1");
  });
});
