import { isNavItemActive } from "@/lib/utils/isNavItemActive";

describe("isNavItemActive", () => {
  it("matches an exact pathname", () => {
    expect(isNavItemActive("/admin/blog", "/admin/blog")).toBe(true);
  });

  it("matches a nested child route", () => {
    expect(isNavItemActive("/admin/blog/moi", "/admin/blog")).toBe(true);
  });

  it("does not match a sibling route with a shared prefix", () => {
    expect(isNavItemActive("/admin/blog-archive", "/admin/blog")).toBe(false);
  });

  it("does not match an unrelated route", () => {
    expect(isNavItemActive("/admin/users", "/admin/blog")).toBe(false);
  });
});
