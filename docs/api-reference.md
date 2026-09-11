# API Reference

All API routes are located in `src/app/api/`.
Base URL: `https://otterbeer.vn/api` (production) / `http://localhost:3000/api` (dev)

> Every route below marked "Requires ... permission" is enforced server-side via
> `RouteGuard` (`src/lib/auth/RouteGuard.ts`) against the live permission matrix
> — see [rbac.md](./rbac.md). Unauthenticated requests get `401`; authenticated
> but under-permissioned requests get `403`.

---

## 🖼️ Hero Section

Singleton resource — there is exactly one Hero Section document (the homepage
carousel's ordered slide list), so there is no `[id]` segment. Mirrors
`/api/brand-story`.

### `GET /api/hero-section`
Read the slide list. *(Requires `hero_section` → `view`)*

**Response `200`:**
```json
{
  "slides": [
    {
      "mediaKey": "hero/2026-08-25/uuid.jpg",
      "mediaType": "image",
      "status": "published",
      "translations": [{ "locale": "vi", "alt": "Otter Beer – Premium Lager" }]
    }
  ]
}
```
`slides` is `[]` when the singleton has never been saved.

### `PUT /api/hero-section`
Replace the whole slide list in one call — this is also how reordering is
persisted. *(Requires `hero_section` → `edit`)*

**Body:** `{ "slides": HeroSlideInput[] }`, validated by
`HeroSectionUpdateSchema` (`src/lib/validation/heroSection.ts`).

| Field | Type | Required | Notes |
|---|---|---|---|
| `mediaKey` | string | ✅ | Storage key from `POST /api/media/upload-url` with `namespace: "hero"` |
| `mediaType` | `"image"` \| `"video"` | — | Defaults to `"image"` |
| `status` | `"draft"` \| `"published"` | — | Defaults to `"draft"`; only `published` slides are publicly visible |
| `translations[].locale` | `"vi"` \| `"en"` | ✅ | `vi` is required, `en` optional |
| `translations[].alt` | string | ✅ | Max 200 chars — read out by the carousel's live region |

At most `MAX_HERO_SLIDES` (12) slides; over that the request is rejected `400`.

**Response `200`:** the saved `{ "slides": [...] }`.


## 📰 News & Blog

### `GET /api/news-blog`
List posts for the admin. *(Requires `news_blog` → `view`)*

**Query parameters:**
| Param | Type | Description |
|---|---|---|
| `status` | `"draft"` \| `"published"` | Filter by status |
| `tag` | string | Filter by tag |
| `search` | string | Case-insensitive title search (any language) |
| `page` / `pageSize` | number | Default `1` / `20`, max `pageSize` 100 |

**Response `200`:**
```json
{
  "items": [ /* BlogPost documents, author populated */ ],
  "total": 42,
  "page": 1,
  "pageSize": 20,
  "totalPages": 3
}
```

### `POST /api/news-blog`
Create a post. *(Requires `news_blog` → `add`)*

**Request body:**
```json
{
  "coverImageKey": "news-blog/2026-08-15/1a2b3c4d.webp",
  "tags": ["brewing", "ipa"],
  "status": "draft",
  "translations": [
    {
      "locale": "vi",
      "title": "Câu chuyện về Otter IPA",
      "excerpt": "Cách chúng tôi tạo ra IPA đặc trưng...",
      "content": "<p>...</p>"
    }
  ]
}
```
`slug` is optional per translation — auto-generated from `title` (Vietnamese-diacritic-aware, unique per locale) if omitted. Vietnamese content is required (see `src/config/locales.ts`); other languages are optional.

**Response `201`:** Full post document. **Response `409`:** slug already taken for that locale.

### `GET /api/news-blog/[id]`
*(Requires `news_blog` → `view`)*

### `PATCH /api/news-blog/[id]`
Partial update — any subset of `coverImageKey`, `tags`, `status`, `translations`. *(Requires `news_blog` → `edit`)*

### `DELETE /api/news-blog/[id]`
*(Requires `news_blog` → `delete`)* **Response `204`.**

---

## 👤 Users

### `GET /api/users`
List every allowlisted user (role populated). *(Requires `users` → `view`)*

### `POST /api/users`
Invite a user — adds them to the login allowlist. *(Requires `users` → `add`)*
```json
{ "email": "member@otterbeer.vn", "name": "Nguyễn Văn A", "roleId": "<Role _id>" }
```
**Response `409`:** email already invited.

### `PATCH /api/users/[id]`
Change role and/or `isActive`. *(Requires `users` → `edit`)* Cannot target your own account (`400`).
```json
{ "roleId": "<Role _id>" }
```
```json
{ "isActive": false }
```

### `DELETE /api/users/[id]`
Removes a user from the allowlist. *(Requires `users` → `delete`)* Cannot target your own account.

---

## 🛡️ Roles

### `GET /api/roles`
*(Requires `roles_permissions` → `view`)*

### `POST /api/roles`
Create a custom role beyond the three seeded ones. *(Requires `roles_permissions` → `add`)*
```json
{ "key": "content_reviewer", "name": "Biên tập viên nội dung" }
```

### `PATCH /api/roles/[id]`
Rename a role. *(Requires `roles_permissions` → `edit`)*

### `DELETE /api/roles/[id]`
*(Requires `roles_permissions` → `delete`)* **Response `400`** if the role is a system role (`isSystem: true`).

---

## 🔐 Permissions (matrix)

### `GET /api/permissions?roleId=<id>`
Returns that role's full module → action grant. *(Requires `roles_permissions` → `view`)*
```json
{
  "roleId": "...",
  "matrix": {
    "news_blog": { "access": true, "view": true, "add": true, "edit": false, "delete": false },
    "users": { "access": false, "view": false, "add": false, "edit": false, "delete": false },
    "roles_permissions": { "access": false, "view": false, "add": false, "edit": false, "delete": false }
  }
}
```

### `PUT /api/permissions`
Bulk-writes one role's matrix. *(Requires `roles_permissions` → `edit`)* Rejects `super_admin` (`400`) — it always has full access and isn't stored as editable rows.
```json
{
  "roleId": "...",
  "grants": [
    { "moduleKey": "news_blog", "actions": { "access": true, "view": true, "add": true, "edit": true, "delete": false } }
  ]
}
```

---

## 🖼️ Media (Cloudinary)

Images never pass through the Next.js server body — the browser uploads directly to Cloudinary using a signed POST. See [security.md](./security.md#6-file-upload-security).

### `POST /api/media/upload-url`

**Body:** `{ contentType, namespace? }`. `namespace` is one of `news-blog`
(default), `beers`, `brand-story`, `hero` — it selects both the storage folder
and the permission module checked (`add` or `edit` on it). Video content types
are accepted only for `hero`.

*(Requires `news_blog` → `add` OR `edit`)*
```json
{ "contentType": "image/webp" }
```
**Response `200`:**
```json
{
  "key": "news-blog/2026-08-15/1a2b3c4d.webp",
  "url": "https://<account>.r2.cloudflarestorage.com/...",
  "fields": { "Content-Type": "image/webp", "...": "..." },
  "expiresAt": "2026-08-15T10:05:00Z"
}
```
The client `POST`s the actual file to `url` with `fields` as multipart form fields, then saves `key` onto the post.

### `POST /api/media/view-url`
*(Requires `news_blog` → `view`)*
```json
{ "key": "news-blog/2026-08-15/1a2b3c4d.webp" }
```
**Response `200`:** `{ "url": "https://<account>.r2.cloudflarestorage.com/...?X-Amz-Signature=..." }` — valid for 1 hour.

---

## 🔐 Auth

Implemented with `next-auth@beta` (Auth.js v5), Google provider only. See [authentication.md](./authentication.md).

### `GET /api/auth/signin`
Redirects to Google OAuth consent screen.

### `GET /api/auth/callback/google`
OAuth callback — handled automatically by Auth.js. Denies sign-in (redirects to error) for emails not on the allowlist or with `isActive: false`.

### `GET /api/auth/session`
Returns the current session.

**Response `200` (logged in):**
```json
{
  "user": {
    "id": "64f1a2b3...",
    "name": "Nguyễn Văn A",
    "email": "admin@otterbeer.vn",
    "image": "https://lh3.googleusercontent.com/...",
    "roleKey": "admin",
    "permissions": {
      "news_blog": { "access": true, "view": true, "add": true, "edit": true, "delete": true },
      "users": { "access": true, "view": true, "add": false, "edit": false, "delete": false },
      "roles_permissions": { "access": true, "view": true, "add": false, "edit": false, "delete": false }
    }
  },
  "expires": "2026-09-05T..."
}
```

---

## Not yet implemented (future modules)

These endpoints don't exist yet — kept here as the earlier plan for when those modules are built. They'll likely follow the same `RouteGuard`/service/repository pattern as News & Blog above rather than this exact shape.

### Beers — `GET/POST /api/beers`, `GET/PUT/DELETE /api/beers/[id]`
### Events — `GET/POST /api/events`, `GET/PUT/DELETE /api/events/[id]`
### Contact — `POST /api/contact`

---

## Error Response Format

All error responses follow this shape:
```json
{ "error": "Human-readable error message" }
```
Validation errors additionally include `details` (Zod's `.flatten()` output):
```json
{ "error": "Validation failed", "details": { "fieldErrors": { "email": ["Invalid email"] } } }
```

| HTTP Status | Meaning |
|---|---|
| `200` | Success |
| `201` | Created |
| `204` | Deleted (no body) |
| `400` | Bad request / validation error |
| `401` | Unauthenticated |
| `403` | Authenticated but the permission matrix denies this action |
| `404` | Resource not found |
| `409` | Conflict (duplicate slug/email/role key) |
| `500` | Server error |
