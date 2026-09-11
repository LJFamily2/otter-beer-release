import { canManageRole, isSuperAdminRoleKey, SYSTEM_ROLE_LEVELS } from "@/config/roles";

describe("canManageRole", () => {
  it("allows managing a strictly lower-ranked role", () => {
    expect(canManageRole(SYSTEM_ROLE_LEVELS.admin, SYSTEM_ROLE_LEVELS.office_member)).toBe(true);
  });

  it("blocks managing a role at the same rank", () => {
    expect(canManageRole(SYSTEM_ROLE_LEVELS.admin, SYSTEM_ROLE_LEVELS.admin)).toBe(false);
  });

  it("blocks managing a higher-ranked role", () => {
    expect(canManageRole(SYSTEM_ROLE_LEVELS.admin, SYSTEM_ROLE_LEVELS.super_admin)).toBe(false);
  });

  it("allows super_admin to manage every other system role", () => {
    expect(canManageRole(SYSTEM_ROLE_LEVELS.super_admin, SYSTEM_ROLE_LEVELS.admin)).toBe(true);
    expect(canManageRole(SYSTEM_ROLE_LEVELS.super_admin, SYSTEM_ROLE_LEVELS.office_member)).toBe(true);
  });
});

describe("isSuperAdminRoleKey", () => {
  it("matches only the super_admin key", () => {
    expect(isSuperAdminRoleKey("super_admin")).toBe(true);
    expect(isSuperAdminRoleKey("admin")).toBe(false);
    expect(isSuperAdminRoleKey("office_member")).toBe(false);
  });
});
