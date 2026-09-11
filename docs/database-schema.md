# Database Schema

## Overview

OtterBeer uses **MongoDB** hosted on **MongoDB Atlas** with **Mongoose** as the ODM.
All models live in `src/models/`. Every module built so far follows a repository
pattern (`src/repositories/`) instead of calling Mongoose directly from routes —
see [architecture.md](./architecture.md).

Media is never stored as a public URL — every media field below stores a
**storage object key** (e.g. `news-blog/2026-08-15/uuid.webp`,
`hero/2026-08-25/uuid.mp4`), and the app hands out
short-lived signed URLs for reading (`StorageService.getViewUrl`). See
[security.md](./security.md#file-upload-security).

---

## Collections

### `roles`
Managed via [`src/models/Role.ts`](../src/models/Role.ts)

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | Auto | |
| `key` | String | ✅ | Unique, lowercase snake_case (`super_admin`, `admin`, `office_member`, or a custom key) |
| `name` | String | ✅ | Vietnamese display label |
| `isSystem` | Boolean | ✅ | `true` for the three seeded roles — blocks deletion |
| `createdAt` / `updatedAt` | Date | Auto | |

### `permissions`
Managed via [`src/models/Permission.ts`](../src/models/Permission.ts)

One row per (role, module) — the editable permission-matrix cell. See [rbac.md](./rbac.md).

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | Auto | |
| `roleId` | ObjectId | ✅ | ref `Role` |
| `moduleKey` | String | ✅ | One of `src/config/permissions.ts`'s `MODULE_KEYS` |
| `actions.access` / `.view` / `.add` / `.edit` / `.delete` | Boolean | ✅ | Default `false` each |
| `createdAt` / `updatedAt` | Date | Auto | |

Unique compound index on `(roleId, moduleKey)`.

### `users`
Managed via [`src/models/User.ts`](../src/models/User.ts)

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | Auto | |
| `email` | String | ✅ | Google account email (unique) — this is the login allowlist |
| `name` | String | ✅ | Display name (kept in sync with Google profile on each login) |
| `image` | String | ❌ | Google profile picture URL |
| `roleId` | ObjectId | ✅ | ref `Role` |
| `isActive` | Boolean | ✅ | `false` revokes access without deleting the user |
| `lastLoginAt` | Date | ❌ | |
| `createdAt` / `updatedAt` | Date | Auto | |

### `blogposts`
Managed via [`src/models/BlogPost.ts`](../src/models/BlogPost.ts) — the **News & Blog** module.

Content is fully multi-language: each post has a `translations` array, one entry per language (currently `vi`, `en` — see `src/config/locales.ts`). Adding a third language later is just a new array entry per post, no schema change.

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | Auto | |
| `coverImageKey` | String | ❌ | Storage object key |
| `authorId` | ObjectId | ✅ | ref `User` |
| `tags` | String[] | ❌ | |
| `status` | Enum | ✅ | `"draft"` \| `"published"` — default `"draft"` |
| `publishedAt` | Date | ❌ | Set the first time status becomes `"published"`; not cleared on unpublish |
| `translations[]` | Array | ✅ | At least one entry required |
| `translations[].locale` | String | ✅ | e.g. `"vi"`, `"en"` |
| `translations[].title` | String | ✅ | Max 200 chars |
| `translations[].slug` | String | ✅ | Lowercase, `[a-z0-9-]+`; auto-generated from `title` (Vietnamese-diacritic-aware) if omitted |
| `translations[].excerpt` | String | ✅ | Max 300 chars — used in cards |
| `translations[].content` | String | ✅ | Sanitized HTML from the WYSIWYG editor (DOMPurify — see security.md) |
| `translations[].seoTitle` | String | ❌ | Max 70 chars |
| `translations[].seoDescription` | String | ❌ | Max 160 chars |
| `translations[].seoKeywords` | String[] | ❌ | |
| `translations[].ogImageKey` | String | ❌ | Storage object key; falls back to `coverImageKey` when unset |
| `createdBy` / `updatedBy` | ObjectId | ✅ | ref `User` — audit trail |
| `createdAt` / `updatedAt` | Date | Auto | |

**Example document:**
```json
{
  "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
  "coverImageKey": "news-blog/2026-08-15/1a2b3c4d.webp",
  "authorId": "64f1a2b3c4d5e6f7a8b9c0aa",
  "tags": ["brewing", "ipa"],
  "status": "published",
  "publishedAt": "2026-08-15T10:00:00Z",
  "translations": [
    {
      "locale": "vi",
      "title": "Câu chuyện về Otter IPA",
      "slug": "cau-chuyen-ve-otter-ipa",
      "excerpt": "Cách chúng tôi tạo ra IPA đặc trưng...",
      "content": "<p>...</p>",
      "seoTitle": "Câu chuyện về Otter IPA | OtterBeer",
      "seoDescription": "Khám phá quy trình ủ bia đằng sau Otter IPA.",
      "seoKeywords": ["otter ipa", "craft beer"]
    },
    {
      "locale": "en",
      "title": "The Story of Otter IPA",
      "slug": "story-of-otter-ipa",
      "excerpt": "How we crafted our signature IPA...",
      "content": "<p>...</p>"
    }
  ],
  "createdBy": "64f1a2b3c4d5e6f7a8b9c0aa",
  "updatedBy": "64f1a2b3c4d5e6f7a8b9c0aa",
  "createdAt": "2026-08-15T09:00:00Z",
  "updatedAt": "2026-08-15T10:00:00Z"
}
```

---

### Not yet implemented (future modules)

The routes/admin pages below are still empty placeholders — schemas here are aspirational from earlier planning and will be revisited (likely reusing the same `translations[]`/storage-object-key patterns as News & Blog) when those modules are actually built.

### `beers`
Managed via [`src/models/Beer.ts`](../src/models/Beer.ts) *(not yet created)*

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | String | ✅ | Beer name |
| `slug` | String | ✅ | URL-safe slug (unique) |
| `description` | String | ✅ | Full description |
| `style` | String | ✅ | e.g. "IPA", "Stout", "Lager" |
| `abv` | Number | ✅ | Alcohol by volume (%) — 0–100 |
| `ibu` | Number | ❌ | International Bitterness Units |
| `price` | Number | ✅ | Price in VND |
| `imageKey` | String | ❌ | Storage object key |
| `isAvailable` | Boolean | ✅ | Default: `true` |
| `isFeatured` | Boolean | ✅ | Show on homepage — Default: `false` |
| `tags` | String[] | ❌ | |

### `events`
Managed via [`src/models/Event.ts`](../src/models/Event.ts) *(not yet created)*

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | String | ✅ | |
| `slug` | String | ✅ | Unique |
| `description` | String | ✅ | |
| `coverImageKey` | String | ❌ | Storage object key |
| `location` | String | ✅ | |
| `startDate` / `endDate` | Date | ✅ / ❌ | |
| `isFree` | Boolean | ✅ | |
| `ticketPrice` | Number | ❌ | |
| `isPublished` | Boolean | ✅ | |

### `contacts`
Managed via [`src/models/Contact.ts`](../src/models/Contact.ts) *(not yet created)*

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` / `email` / `subject` / `message` | String | ✅ | |
| `phone` | String | ❌ | |
| `status` | Enum | ✅ | `"new"` \| `"read"` \| `"replied"` \| `"archived"` |

---

## Indexes

```javascript
// roles
db.roles.createIndex({ key: 1 }, { unique: true });

// permissions
db.permissions.createIndex({ roleId: 1, moduleKey: 1 }, { unique: true });

// users
db.users.createIndex({ email: 1 }, { unique: true });

// blogposts — slug uniqueness is scoped per language via this multikey index
db.blogposts.createIndex(
  { "translations.locale": 1, "translations.slug": 1 },
  { unique: true }
);
db.blogposts.createIndex({ status: 1, publishedAt: -1 });
db.blogposts.createIndex({ tags: 1 });
```

(All of the above are already declared on the Mongoose schemas via `Schema.index()` and are created automatically — the raw commands are here for reference/manual verification.)

---

## MongoDB Atlas Setup

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas) — create **two** (or two databases on one cluster), one for dev and one for prod. See [Per-environment database & storage](#per-environment-database--storage) below for why.
2. Create a database named `otter-beer` (or `otter-beer-dev` / `otter-beer-prod` if sharing one cluster)
3. Create a database user with **readWrite** on that database
4. Whitelist `0.0.0.0/0` for your hosting provider (or use its static IP list)
5. Copy the connection string to `MONGODB_URI` — dev cluster's string goes in `.env.development.local`, prod cluster's string goes in `.env.production.local`

**Connection string format:**
```
mongodb+srv://<user>:<password>@<cluster>.mongodb.net/otter-beer?retryWrites=true&w=majority
```

---

## Per-environment database

Development and production use **separate MongoDB clusters** — local development should never be able to read, write, or delete production data.

| Variable | Dev value lives in | Prod value lives in |
|---|---|---|
| `MONGODB_URI` | `.env.development.local` | `.env.production.local` |

The two per-environment files use the exact same variable names — only the values differ — because `src/lib/env.ts` and every repository/service just read `process.env.MONGODB_URI` with no environment branching in code. Next.js's built-in env loading picks the right file automatically:

- `pnpm dev` (and `pnpm run seed`) loads `.env.development.local`
- `pnpm build` / `pnpm start` (and `pnpm run seed:prod`) loads `.env.production.local`
- `.env.local` is shared by both (auth secrets, site URL, Cloudinary credentials) — see [authentication.md](./authentication.md#environment-variables-envlocal)

All three files are git-ignored; only `.env.example` (with blank values) is committed. When deploying to Vercel, set `MONGODB_URI` under the **Production** environment scope in the Vercel dashboard with your prod value (Preview/Development scope gets the dev value). Vercel injects these directly, so `.env.production.local` is only needed locally if you build/start the prod bundle or run `pnpm run seed:prod` from your own machine.

---

### `herosections`
Managed via [`src/models/HeroSection.ts`](../src/models/HeroSection.ts)

**Singleton** — exactly one document holds the homepage hero carousel's
ordered slide list, like `brandstories`. Replaced whole on save
(`HeroSectionRepository.replaceSlides`).

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | Auto | |
| `slides` | Array\<HeroSlide\> | — | Ordered; the array order *is* the carousel order. Capped at 12 by `HeroSectionUpdateSchema` |
| `updatedBy` | ObjectId → `users` | ✅ | |
| `createdAt` / `updatedAt` | Date | Auto | |

**HeroSlide subdocument** (`_id: false`):

| Field | Type | Required | Notes |
|---|---|---|---|
| `mediaKey` | String | ✅ | Storage object key — image or video |
| `mediaType` | String | ✅ | `image` \| `video`, default `image`; drives `<img>` vs `<video>` at render time |
| `status` | String | ✅ | `draft` \| `published`, default `draft` — per-slide, so one slide can be staged without pulling the hero down. Only `published` slides are served publicly (`HeroSectionRepository.isKeyPubliclyVisible`) |
| `translations` | Array\<{locale, alt}\> | — | `alt` max 200 chars; `vi` required at the validation layer |

