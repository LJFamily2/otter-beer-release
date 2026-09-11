# 📚 OtterBeer — Project Documentation

Welcome to the official technical documentation for the **OtterBeer** website (otterbeer.vn).

---

## Quick Links

| Document | Description |
|---|---|
| [Architecture](./architecture.md) | System overview, tech stack, data flow |
| [Database Schema](./database-schema.md) | MongoDB collections & field definitions |
| [API Reference](./api-reference.md) | All API endpoints with examples |
| [Authentication & Roles](./authentication.md) | Google OAuth setup, roles, security model |
| [Permission Matrix (RBAC)](./rbac.md) | Per-module Truy cập/Xem/Thêm/Sửa/Xóa permission system |
| [Internationalization (i18n)](./internationalization.md) | VI/EN language routing and content translations |
| [Security](./security.md) | JWT/cookie storage, input validation, CSP, rate limiting |
| [Testing](./testing.md) | Testing strategy, AI agent workflow rule, Playwright + Jest |
| [SEO / AEO / GEO](./seo.md) | Crawlable HTML, metadata, sitemap/robots, schema.org graph, FAQ answer surface, llms.txt |
| [Deployment](./deployment.md) | Vercel deployment guide |
| [Design System](./DESIGN.md) | Coastal Premium colors, fonts, tokens |
| [Component Library](./component-library.md) | Reusable UI kit — props, variants, the "customize via props" rule |
| [Component Catalog](./component-catalog.md) | Sitewide inventory of every component and page — check before building, append when you add one |

---

## Project Summary

**OtterBeer** is a bilingual (Vietnamese / English) craft beer brand website and content management platform.

- **Frontend**: Next.js 16 App Router with TypeScript — public marketing site (VI + EN)
- **Backend**: Next.js API Routes — REST API for all data
- **Database**: MongoDB + Mongoose
- **Image Storage**: Cloudinary
- **Authentication**: Google OAuth via Auth.js v5 — with a per-module permission matrix (see [rbac.md](./rbac.md))
- **Admin Panel**: Internal CMS at `/admin` — Vietnamese UI, protected by role + permission matrix
- **Deployment**: Vercel (frontend + serverless backend) + Cloudinary (storage)

---

## For New Developers

→ See [ONBOARDING.md](../ONBOARDING.md) for setup instructions.
