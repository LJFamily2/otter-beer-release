# Hybrid Access Control (Role Defaults + Per-User Overrides)

This is the "Truy cập / Xem / Thêm / Sửa / Xóa" (Access / View / Add / Edit / Delete) permission system built on a **Hybrid Access Control Architecture**:
1. **Role Baseline Defaults**: Roles store default permission matrices (`/admin/roles`). Every user assigned to a role automatically inherits these defaults without manual setup.
2. **Per-User Overrides**: Admins can customize individual user accounts (`/admin/users`) with per-user permission overrides.
3. **Reset to Defaults**: Admins can clear a user's custom overrides at any time, instantly reverting them to their role's baseline defaults.
4. **superAdmin Bypass**: `super_admin` always resolves to full access via code bypass so admins can never lock themselves out.

## Concepts

| Term | Meaning | Source of truth |
|---|---|---|
| **Module** | An admin feature area, e.g. "Tin tức & Blog" | `src/config/permissions.ts` (`MODULE_KEYS`) — code-defined |
| **Action** | One of `access`, `view`, `add`, `edit`, `delete` | `src/config/permissions.ts` (`PERMISSION_ACTIONS`) |
| **Role** | `super_admin` / `admin` / `office_member`, or a custom role | `src/models/Role.ts` — DB-stored |
| **Level** | Hierarchy rank on a role — lower is more senior | `Role.level` — see "Role hierarchy" below |
| **Role Grant** | Default `{access, view, add, edit, delete}` row for a (role, module) | `src/models/Permission.ts` (`roleId`) |
| **User Grant** | Custom override `{access, view, add, edit, delete}` row for a (user, module) | `src/models/Permission.ts` (`userId`) |

### Action meanings

| Action | Vietnamese label | Meaning |
|---|---|---|
| `access` | Truy cập | Show this module in the admin sidebar navigation at all |
| `view` | Xem | Open the list/detail pages |
| `add` | Thêm | Create new records |
| `edit` | Sửa | Modify existing records |
| `delete` | Xóa | Delete records |

## Resolution Order

When checking what a user can do:

1. **superAdmin Check**: If `user.roleKey === "super_admin"`, grant full access immediately.
2. **User Custom Overrides**: Check if any custom permission rows exist for `userId`. If yes, use the user's custom matrix (`isCustom: true`).
3. **Role Baseline Defaults**: Fall back to the permission rows configured for `roleId` (`isCustom: false`).

## Role hierarchy

Roles are ranked so that **only a strictly more senior role can create, edit, or delete a given role — or grant it to a user, or modify that user's permissions**:

| Role | Level |
|---|---|
| `super_admin` | 0 |
| `admin` | 1 |
| `office_member` | 2 |
| custom role | creator's level + 1 |

`canManageRole(actorLevel, targetLevel)` (`src/config/roles.ts`) is `actorLevel < targetLevel`.

## API

- `GET /api/permissions?roleId=<id>` — returns role baseline defaults
- `GET /api/permissions?userId=<id>` — returns effective user matrix + `isCustom` status
- `PUT /api/permissions` — updates role matrix (`roleId`) or user custom overrides (`userId`)
- `DELETE /api/permissions?userId=<id>` — resets user to role baseline defaults

## Admin UI

- **`/admin/roles`** (Vai trò & Phân quyền) — role list + baseline default matrix editor.
- **`/admin/users`** (Người dùng) — user directory + 🛡️ per-user permission modal (inspects effective matrix, allows saving custom overrides or resetting to role defaults).
- **`/admin/tai-khoan`** (Account Settings) — personal profile + permissions summary for all users.
