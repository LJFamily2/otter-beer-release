import { localizedPath } from "@/lib/seo";

describe("localizedPath", () => {
  it("returns the bare path for the default locale (vi)", () => {
    expect(localizedPath("vi", "/blog")).toBe("/blog");
    expect(localizedPath("vi", "blog")).toBe("/blog");
  });

  it("prefixes non-default locales", () => {
    expect(localizedPath("en", "/blog")).toBe("/en/blog");
  });

  it("handles the root path", () => {
    expect(localizedPath("vi", "/")).toBe("/");
    expect(localizedPath("en", "/")).toBe("/en/");
  });
});
