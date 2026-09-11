# Architecture Overview

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          VERCEL EDGE                            │
│                                                                 │
│  ┌─────────────────────────┐   ┌──────────────────────────┐    │
│  │   Marketing Site        │   │   Admin Panel            │    │
│  │   otterbeer.vn/         │   │   otterbeer.vn/admin     │    │
│  │   otterbeer.vn/en/      │   │   (Vietnamese only)      │    │
│  │                         │   │                          │    │
│  │  Route Group:           │   │  Route Group:            │    │
│  │  src/app/(marketing)/   │   │  src/app/(admin)/        │    │
│  │                         │   │                          │    │
│  │  Public — no auth       │   │  Protected — roles req.  │    │
│  └────────────┬────────────┘   └────────────┬─────────────┘    │
│               │                             │                   │
│               └──────────────┬──────────────┘                   │
│                              │                                   │
│                    ┌─────────▼──────────┐                       │
│                    │   Next.js API       │                       │
│                    │   /api/beers        │                       │
│                    │   /api/blog         │                       │
│                    │   /api/events       │                       │
│                    │   /api/contact      │                       │
│                    │   /api/upload       │                       │
│                    │   /api/auth         │  ← NextAuth.js        │
│                    └────┬───────┬────────┘                       │
│                         │       │                                │
│              ┌──────────▼─┐  ┌──▼──────────────┐               │
│              │  MongoDB   │  │    Cloudinary    │               │
│              │  (Atlas)   │  │                  │               │
│              │            │  │                  │               │
│              └────────────┘  └─────────────────┘               │
└─────────────────────────────────────────────────────────────────┘

External Services:
  Google OAuth ←──── Auth.js v5

Route protection: src/proxy.ts (Next.js 16 renamed middleware.ts → proxy.ts)
```

---

## Tech Stack

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Framework | Next.js | 16.x | App Router, Turbopack dev |
| Language | TypeScript | 5.x | Strict mode |
| Styling | Vanilla CSS | — | CSS Custom Properties (no Tailwind) |
| Database | MongoDB + Mongoose | 9.x | Atlas cloud-hosted |
| Auth | Auth.js (next-auth) | v5 (beta) | Google OAuth only + allowlist |
| Authorization | Custom permission matrix | — | `src/services/PermissionService.ts` — see [rbac.md](./rbac.md) |
| Image Storage | Cloudinary | API | Cloudinary REST API |
| Deployment | Vercel | — | Serverless + Edge |
| i18n | Next.js Proxy (`src/proxy.ts`) | Built-in | Domain path routing (VI default, `/en`); renamed from Middleware in Next 16 |

---

## Folder Structure

```
p:\Otter Beer\otter-beer\
├── docs/                         ← You are here — project documentation
├── public/
│   └── images/                   ← Static images (logo, OG image)
├── src/
│   ├── app/
│   │   ├── (marketing)/          ← Public-facing pages (VI + EN via middleware)
│   │   │   ├── layout.tsx        ← Navbar + Footer shell
│   │   │   ├── page.tsx          ← Homepage
│   │   │   ├── menu/             ← Beer catalog
│   │   │   ├── about/
│   │   │   ├── events/
│   │   │   ├── blog/
│   │   │   │   └── [slug]/       ← Individual blog posts
│   │   │   └── contact/
│   │   ├── (admin)/
│   │   │   └── admin/            ← Protected admin panel
│   │   │       ├── layout.tsx    ← Sidebar shell (Vietnamese)
│   │   │       ├── page.tsx      ← Dashboard
│   │   │       ├── beers/        ← Beer CRUD
│   │   │       ├── blog/         ← Blog post CRUD
│   │   │       └── events/       ← Event CRUD
│   │   ├── api/
│   │   │   ├── news-blog/        ← News & Blog REST endpoints (built)
│   │   │   ├── users/            ← User allowlist management (built)
│   │   │   ├── roles/            ← Role CRUD (built)
│   │   │   ├── permissions/      ← Permission-matrix read/update (built)
│   │   │   ├── media/            ← Cloudinary signed upload/view URLs (built)
│   │   │   ├── beers/            ← Beer REST endpoints (not yet built)
│   │   │   ├── events/           ← Event REST endpoints (not yet built)
│   │   │   ├── contact/          ← Contact form submission (not yet built)
│   │   │   └── auth/[...nextauth]/ ← Auth.js handler
│   │   ├── layout.tsx            ← Root layout (lang="vi", fonts, global meta)
│   │   ├── globals.css           ← Design tokens + reset
│   │   ├── sitemap.ts            ← Auto-generated SEO sitemap
│   │   └── not-found.tsx         ← 404 page
│   ├── proxy.ts                  ← Route protection (Next 16's middleware.ts → proxy.ts)
│   ├── auth.ts                   ← Auth.js config (Google provider, callbacks)
│   ├── components/
│   │   ├── ui/                   ← Button, Card, Badge, Input, Modal…
│   │   ├── layout/               ← Navbar, Footer, Sidebar
│   │   ├── sections/             ← Hero, FeaturedBeers, EventCards…
│   │   └── admin/                ← DataTable, Forms, ImageUploader… (not yet built)
│   ├── config/
│   │   ├── locales.ts            ← Content-language registry (vi/en, extensible)
│   │   ├── roles.ts              ← System role keys (super_admin/admin/office_member)
│   │   ├── permissions.ts        ← Module + action registry for the permission matrix
│   │   └── site.ts               ← Brand info, nav links, socials, contact (not yet built)
│   ├── lib/
│   │   ├── db/mongodb.ts         ← Mongoose connection singleton (`Database` class)
│   │   ├── env.ts                ← Zod-validated environment variables
│   │   ├── storage/               ← CloudinaryStorageProvider, StorageService
│   │   ├── auth/RouteGuard.ts    ← API route auth/permission wrapper
│   │   ├── utils/                 ← SlugGenerator, HtmlSanitizer
│   │   └── validation/            ← Zod schemas per domain
│   ├── repositories/             ← BaseRepository + one repository per model
│   ├── services/                 ← AuthService, PermissionService, BlogPostService, RoleService, UserService
│   ├── models/
│   │   ├── User.ts               ← User Mongoose model
│   │   ├── Role.ts               ← Role Mongoose model
│   │   ├── Permission.ts         ← Permission-matrix row Mongoose model
│   │   ├── BlogPost.ts           ← News & Blog Mongoose model (multi-locale)
│   │   ├── Beer.ts               ← (not yet created)
│   │   ├── Event.ts              ← (not yet created)
│   │   └── Contact.ts            ← (not yet created)
│   ├── hooks/
│   │   ├── use-beers.ts          ← Client beer data fetcher (not yet built)
│   │   ├── use-scroll.ts         ← Scroll position tracker (not yet built)
│   │   └── use-media-query.ts    ← Responsive breakpoints (not yet built)
│   └── types/
│       └── next-auth.d.ts        ← Session/JWT module augmentation
├── .env.example                  ← Environment variable template
├── .gitignore
├── ONBOARDING.md                 ← New developer setup guide
├── README.md
├── next.config.ts
└── tsconfig.json
```

---

## Request Lifecycle

### Public page request (e.g. GET `/en/menu`)
```
Browser → Vercel Edge → src/proxy.ts
  → Detects locale ("en") from path
  → Passes to [locale]/menu/page.tsx (Server Component)
    → Fetches data from MongoDB directly (server-side)
    → Renders HTML with translations from i18n dictionaries
  → Returns complete HTML to browser
```

### API request (e.g. GET `/api/news-blog`)
```
Client → /api/news-blog/route.ts
  → RouteGuard.requirePermission(NEWS_BLOG, "view", handler)
    → auth() resolves session + live permission matrix
    → 401 if no session, 403 if matrix denies "view"
  → BlogPostService.list() → BlogPostRepository → Database.connect()
  → Response.json(result)
```

### Admin page request (e.g. GET `/admin/blog`)
```
Browser → src/proxy.ts
  → auth() checks session (Google OAuth via Auth.js)
  → If no session → redirect to /admin/dang-nhap
  → (admin)/admin/blog/page.tsx renders (not yet built)
    → reads session.user.permissions.news_blog to gate nav/view/actions
```

### Image upload (e.g. POST /api/media/upload-url)
```
Admin form → POST /api/media/upload-url { contentType }
  → RouteGuard.requireAuth + checks news_blog add/edit permission
  → StorageService.requestImageUpload() → CloudinaryStorageProvider
  → Returns { url, fields, key } — browser POSTs the file directly to Cloudinary
  → key (not a public URL) is saved on the BlogPost document
  → Reading the image later goes through POST /api/media/view-url → a
    short-lived signed GET URL
```

---

## Key Design Decisions

### Why Next.js for backend?
Reduces operational complexity — one deployment, one codebase. API routes run as Vercel Serverless Functions. For a brand website at this scale, this is the right tradeoff.

### Why MongoDB?
Schema flexibility is important during early design — beer styles, event types, and blog structure may evolve. Mongoose provides schema validation while keeping migration overhead low. The News & Blog module's per-language `translations[]` array is a direct example: adding a language is a data change, not a migration.

### Why Cloudinary for images?
Cloudinary provides excellent out-of-the-box optimization and transformation pipelines, and the current flow uses short-lived signed URLs to keep image access auditable.

### Why Google OAuth only?
Simplifies the auth surface. The security model relies on an email allowlist (`User` documents) plus a per-module permission matrix — only invited, active users can sign in, and what they can do is configurable per role rather than a fixed hierarchy. See [authentication.md](./authentication.md) and [rbac.md](./rbac.md) for details.

### Why a repository/service layer instead of calling Mongoose from routes?
The user asked for an OOP, reusable structure. `BaseRepository<T>` centralizes CRUD + pagination so every new model gets consistent query behavior for free; `Service` classes hold business logic (slug generation, sanitization, permission resolution) so route handlers stay thin controllers. Adding the next module (beers, events) means extending these base classes, not duplicating query/validation code.
