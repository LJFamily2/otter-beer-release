import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { OG_IMAGE_HEIGHT, OG_IMAGE_PATH, OG_IMAGE_WIDTH, LOGO_PATH } from "@/lib/seo";

const PUBLIC_DIR = join(process.cwd(), "public");
const SRC_DIR = join(process.cwd(), "src");

/** Reads width/height out of a PNG IHDR chunk. */
function pngSize(absPath: string): { width: number; height: number } {
  const buf = readFileSync(absPath);
  expect(buf.subarray(1, 4).toString()).toBe("PNG");
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

/** Every source file, recursively. */
function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) sourceFiles(full, acc);
    else if (/\.(ts|tsx)$/.test(entry)) acc.push(full);
  }
  return acc;
}

describe("public asset integrity", () => {
  /**
   * The regression this locks down: /images/contact-hero.jpeg was referenced
   * from four places (the /contact OpenGraph image, a hero fallback slide and
   * two brand-story chapters) while the file on disk is contact-hero.jpg.
   * Every one of those was a silent 404 — a broken share preview and broken
   * images — that nothing in the suite would have caught.
   */
  it("resolves every /images/... path referenced anywhere in src to a real file", () => {
    const referenced = new Set<string>();

    for (const file of sourceFiles(SRC_DIR)) {
      const contents = readFileSync(file, "utf8");
      for (const match of contents.matchAll(
        /\/images\/[A-Za-z0-9_/.-]+\.(?:png|jpg|jpeg|svg|webp|gif)/g
      )) {
        referenced.add(match[0]);
      }
    }

    // Guard against the matcher silently finding nothing and passing.
    expect(referenced.size).toBeGreaterThan(5);

    const missing = [...referenced].filter(
      (ref) => !existsSync(join(PUBLIC_DIR, ref))
    );
    expect(missing).toEqual([]);
  });
});

describe("OpenGraph share card", () => {
  const ogAbsolutePath = join(PUBLIC_DIR, OG_IMAGE_PATH);

  it("exists on disk", () => {
    expect(existsSync(ogAbsolutePath)).toBe(true);
  });

  /**
   * The metadata in src/lib/seo.ts and src/app/layout.tsx declares
   * width/height to Facebook, X and Zalo, and they trust the declaration.
   * The old asset was 1024x1024 published as 1200x630, so every shared link
   * rendered a mis-cropped card. This asserts the file and the claim agree.
   */
  it("is genuinely 1200x630, matching the dimensions the metadata declares", () => {
    expect(pngSize(ogAbsolutePath)).toEqual({
      width: OG_IMAGE_WIDTH,
      height: OG_IMAGE_HEIGHT,
    });
  });

  it("uses the 1.91:1 aspect ratio the OpenGraph spec asks for", () => {
    expect(OG_IMAGE_WIDTH / OG_IMAGE_HEIGHT).toBeCloseTo(1.91, 1);
  });

  it("stays under Twitter's 5MB card limit", () => {
    expect(statSync(ogAbsolutePath).size).toBeLessThan(5 * 1024 * 1024);
  });

  it("points at a dedicated card, not the square hero art it used to reuse", () => {
    expect(OG_IMAGE_PATH).not.toBe("/images/otter-beer-hero.png");
  });

  it("still resolves the Organization logo used by the JSON-LD", () => {
    expect(existsSync(join(PUBLIC_DIR, LOGO_PATH))).toBe(true);
  });
});
