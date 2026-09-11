# Authentication & Roles

## Overview

OtterBeer uses **Google OAuth** exclusively (via [Auth.js v5 / next-auth@beta](https://authjs.dev)) for admin authentication. The public marketing site has no authentication. The admin panel (`/admin/*`) is fully protected.

There is no self-service sign-up. Only emails already added as a `User` document (the **allowlist**) may sign in, even with a fully valid Google account — see [Adding the First Admin User](#adding-the-first-admin-user) and the "Invite user" flow under [Users module](#users-module).

---

## Is Google-Only OAuth Safe?

**Yes — with the right safeguards in place.**

### ✅ What Google OAuth gives you
- No passwords stored in your database (Google handles credentials)
- Built-in brute-force protection (Google's own systems)
- MFA support — users can enable Google 2FA on their own account
- OAuth tokens expire and rotate automatically

### ⚠️ The one risk: Account compromise
If a team member's Google account is ever compromised, the attacker gets admin access. Mitigations:
1. **Allowlist** — only emails explicitly invited can log in
2. **Granular, per-module permissions** — limit blast radius by module and action (see [rbac.md](./rbac.md))
3. **`isActive: false`** revokes access instantly on next request, without deleting the account (audit trail on posts stays intact)
4. **Encourage Google 2FA** on every admin's Google account

---

## Roles

Three system roles ship pre-seeded (`scripts/seed.ts`) and cannot be deleted:

| Role key | Vietnamese label | Notes |
|---|---|---|
| `super_admin` | Quản trị viên cấp cao | Always has full access to every module/action. Never checked against the permission matrix — see [rbac.md](./rbac.md#why-superadmin-bypasses-the-matrix). |
| `admin` | Quản trị viên | Full CRUD on News & Blog by default; view-only on Users and Roles & Permissions by default. |
| `office_member` | Nhân viên văn phòng | View + Add only on News & Blog by default (drafts need an admin to edit/publish). |

Roles themselves are data (`src/models/Role.ts`), not a hardcoded enum — a superAdmin can add more roles later from the Roles & Permissions screen without any code change. See [rbac.md](./rbac.md) for the full permission-matrix design (this is the "Truy cập / Xem / Thêm / Sửa / Xóa" system requested for every module).

---

## User Model

```typescript
// src/models/User.ts
interface IUser {
  email: string;      // Google account email (unique)
  name: string;
  image?: string;      // Google profile picture URL
  roleId: ObjectId;    // ref Role
  isActive: boolean;   // false = revoked, without deleting
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

## Access Control Flow

```
Google OAuth callback (profile.email)
  → auth.ts callbacks.signIn()
      → AuthService.handleSignIn()
          → User found + isActive?  → allow
          → Not found, but matches FIRST_SUPER_ADMIN_EMAIL
            and no users exist yet? → bootstrap as superAdmin, allow
          → otherwise                → deny
  → callbacks.jwt() re-resolves roleKey from the DB on every request
    (not just at login) — so a role change or isActive:false revocation
    takes effect on the user's very next request.
  → callbacks.session() computes the live permission matrix for that
    role and attaches it to session.user.permissions
  → proxy.ts (src/proxy.ts) redirects unauthenticated /admin/* requests
    to /admin/dang-nhap
  → Each API route re-checks session.user.permissions via RouteGuard
    before any read/write — see docs/rbac.md
```

## Auth.js Setup

Already wired in the codebase:

```
src/
├── auth.ts                       ← Auth.js config (Google provider, callbacks)
├── proxy.ts                      ← Route protection (Next.js 16 renamed middleware.ts → proxy.ts)
└── app/api/auth/[...nextauth]/route.ts
```

### Environment variables (`.env.local`)
```bash
AUTH_SECRET=<openssl rand -base64 32>
AUTH_GOOGLE_ID=<from Google Cloud Console>
AUTH_GOOGLE_SECRET=<from Google Cloud Console>
FIRST_SUPER_ADMIN_EMAIL=<your email, for the one-time bootstrap>
```

### Google Cloud Console Setup
1. [console.cloud.google.com](https://console.cloud.google.com) → new/existing project
2. Enable **Google Identity**
3. OAuth 2.0 credentials → **Web application**
4. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://otterbeer.vn/api/auth/callback/google` (prod)
5. Copy Client ID/Secret into `.env.local`

## Adding the First Admin User

The allowlist starts empty, so there's a one-time bootstrap — do this once per database (dev and prod each need their own bootstrap, since they're separate MongoDB clusters; see [database-schema.md](./database-schema.md#per-environment-database--storage)):

1. Run `pnpm run seed` for the dev DB, or `pnpm run seed:prod` for the prod DB (creates the three system roles + default permission matrix). The script prints which database it's about to write to — check that before it runs.
2. Set `FIRST_SUPER_ADMIN_EMAIL` in `.env.local` (shared) to your own Google account email.
3. Sign in once at `/admin/dang-nhap`, on whichever deployment points at the database you just seeded — that sign-in creates you as `super_admin` there.
4. (Optional) Unset `FIRST_SUPER_ADMIN_EMAIL` afterward; it only matters while the `users` collection is empty.

Every admin/officeMember added after that goes through **Users → Mời người dùng (Invite user)** in the admin panel, which calls `POST /api/users` — this just adds the allowlist row; the person still authenticates with their own Google account.
