/**
 * Registry of admin modules and the actions the permission matrix governs.
 *
 * Adding a future module (e.g. beers, events) is a two-line change here —
 * everything else (matrix storage, guard, admin UI) reads from this list.
 */

export const PERMISSION_ACTIONS = {
  ACCESS: "access",
  VIEW: "view",
  ADD: "add",
  EDIT: "edit",
  DELETE: "delete",
} as const;

export type PermissionAction =
  (typeof PERMISSION_ACTIONS)[keyof typeof PERMISSION_ACTIONS];

export const PERMISSION_ACTION_LABELS_VI: Record<PermissionAction, string> = {
  [PERMISSION_ACTIONS.ACCESS]: "Truy cập",
  [PERMISSION_ACTIONS.VIEW]: "Xem",
  [PERMISSION_ACTIONS.ADD]: "Thêm",
  [PERMISSION_ACTIONS.EDIT]: "Sửa",
  [PERMISSION_ACTIONS.DELETE]: "Xóa",
};

export const PERMISSION_ACTION_KEYS: readonly PermissionAction[] =
  Object.values(PERMISSION_ACTIONS);

export const MODULE_KEYS = {
  NEWS_BLOG: "news_blog",
  HERO_SECTION: "hero_section",
  BEERS: "beers",
  BRAND_STORY: "brand_story",
  USERS: "users",
  ROLES_PERMISSIONS: "roles_permissions",
} as const;

export type ModuleKey = (typeof MODULE_KEYS)[keyof typeof MODULE_KEYS];

export const MODULE_LABELS_VI: Record<ModuleKey, string> = {
  [MODULE_KEYS.NEWS_BLOG]: "Tin tức & Blog",
  [MODULE_KEYS.HERO_SECTION]: "Ảnh bìa trang chủ",
  [MODULE_KEYS.BEERS]: "Sản phẩm bia",
  [MODULE_KEYS.BRAND_STORY]: "Câu chuyện thương hiệu",
  [MODULE_KEYS.USERS]: "Người dùng",
  [MODULE_KEYS.ROLES_PERMISSIONS]: "Vai trò & Phân quyền",
};

export const MODULE_KEYS_LIST: readonly ModuleKey[] =
  Object.values(MODULE_KEYS);

export function isKnownModuleKey(value: string): value is ModuleKey {
  return (MODULE_KEYS_LIST as readonly string[]).includes(value);
}

/** A module's full action grant, e.g. as stored per-role in the Permission collection. */
export type ActionGrant = Record<PermissionAction, boolean>;

export function noAccessGrant(): ActionGrant {
  return {
    access: false,
    view: false,
    add: false,
    edit: false,
    delete: false,
  };
}

export function fullAccessGrant(): ActionGrant {
  return {
    access: true,
    view: true,
    add: true,
    edit: true,
    delete: true,
  };
}
