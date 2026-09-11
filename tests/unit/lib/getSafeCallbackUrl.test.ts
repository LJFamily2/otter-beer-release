import { getSafeCallbackUrl } from "@/lib/auth/getSafeCallbackUrl";

describe("getSafeCallbackUrl", () => {
  it("accepts a same-origin relative path", () => {
    expect(getSafeCallbackUrl("/admin/dashboard")).toBe("/admin/dashboard");
  });

  it("falls back for undefined/null/empty input", () => {
    expect(getSafeCallbackUrl(undefined)).toBe("/admin");
    expect(getSafeCallbackUrl(null)).toBe("/admin");
    expect(getSafeCallbackUrl("")).toBe("/admin");
  });

  it("falls back for a custom fallback value", () => {
    expect(getSafeCallbackUrl(undefined, "/admin/blog")).toBe("/admin/blog");
  });

  it("rejects absolute cross-origin URLs", () => {
    expect(getSafeCallbackUrl("https://evil.com")).toBe("/admin");
    expect(getSafeCallbackUrl("http://evil.com/phish")).toBe("/admin");
  });

  it("rejects protocol-relative URLs disguised as a path", () => {
    expect(getSafeCallbackUrl("//evil.com")).toBe("/admin");
  });

  it("rejects backslash-disguised protocol-relative URLs", () => {
    expect(getSafeCallbackUrl("/\\evil.com")).toBe("/admin");
  });

  it("rejects values that don't start with a slash", () => {
    expect(getSafeCallbackUrl("evil.com")).toBe("/admin");
    expect(getSafeCallbackUrl("javascript:alert(1)")).toBe("/admin");
  });
});
