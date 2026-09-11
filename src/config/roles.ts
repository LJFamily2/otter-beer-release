/**
 * The three built-in roles requested for OtterBeer. These are seeded into the
 * `roles` collection by scripts/seed.ts and are protected from deletion
 * (Role.isSystem = true) so the app can never be left without an admin tier.
 *
 * The role *system* itself is still data-driven (see src/models/Role.ts) —
 * a superAdmin can create additional custom roles later from the admin UI
 * without any code change. These constants exist so code that must reason
 * about the built-in roles (bootstrap, seeding, "is this the super admin"
 * checks) has a single source of truth instead of magic strings.
 */

export const SYSTEM_ROLE_KEYS = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  OFFICE_MEMBER: "office_member",
} as const;

export type SystemRoleKey =
  (typeof SYSTEM_ROLE_KEYS)[keyof typeof SYSTEM_ROLE_KEYS];

export const SYSTEM_ROLE_LABELS_VI: Record<SystemRoleKey, string> = {
  [SYSTEM_ROLE_KEYS.SUPER_ADMIN]: "Quản trị viên cấp cao",
  [SYSTEM_ROLE_KEYS.ADMIN]: "Quản trị viên",
  [SYSTEM_ROLE_KEYS.OFFICE_MEMBER]: "Nhân viên văn phòng",
};

/**
 * Hierarchy rank for the three built-in roles — lower is more senior.
 * Seeded onto Role.level by scripts/seed.ts. Custom roles never appear
 * here; their level is always computed at creation time as
 * (creator's level + 1) — see RoleService.create().
 */
export const SYSTEM_ROLE_LEVELS: Record<SystemRoleKey, number> = {
  [SYSTEM_ROLE_KEYS.SUPER_ADMIN]: 0,
  [SYSTEM_ROLE_KEYS.ADMIN]: 1,
  [SYSTEM_ROLE_KEYS.OFFICE_MEMBER]: 2,
};

/**
 * The super admin always has full access to every module and action and is
 * never checked against the Permission matrix — this prevents a misconfigured
 * matrix from locking every admin out of the system. See PermissionService.
 */
export function isSuperAdminRoleKey(key: string): boolean {
  return key === SYSTEM_ROLE_KEYS.SUPER_ADMIN;
}

/**
 * Whether an actor at `actorLevel` may create/edit/delete a role (or grant
 * it to a user) at `targetLevel`. Strictly lower only — an actor can never
 * manage a role at their own rank or above, so e.g. an admin can't touch
 * the admin role itself or promote anyone to it.
 */
export function canManageRole(actorLevel: number, targetLevel: number): boolean {
  return actorLevel < targetLevel;
}
