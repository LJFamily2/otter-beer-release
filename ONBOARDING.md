# 🦦 Otter Beer — Onboarding Guide

Welcome to the **OtterBeer** codebase! This guide gets you set up from zero to a running dev server.

---

## 📋 Prerequisites

- **Node.js** ≥ 20 (use [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm))
- **npm** ≥ 10
- **MongoDB** — local instance or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- A **Vercel account** for Blob storage (free tier is fine)
- A **Vercel project** with Blob enabled, or local Blob token for dev

---

## 🚀 Quick Start

```bash
# 1. Clone
git clone <repo-url>
cd otter-beer

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.example .env.local
# Fill in all values in .env.local (see below)

# 4. Start the dev server
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 🔐 Environment Variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string (e.g. `mongodb+srv://...`) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token from your Vercel project settings |
| `NEXT_PUBLIC_SITE_URL` | Base URL (e.g. `https://otterbeer.vn` or `http://localhost:3000`) |

---

## 🤖 AI Agent Skills — **MANDATORY SETUP**

> [!IMPORTANT]
> Every developer **must install these AI agent skills** before contributing.
> These are not npm packages — they are instruction files for your AI coding assistant
> (Antigravity, Cursor, Claude Code, etc.) that enforce our design standards.
> **Skipping this will result in lower-quality AI-generated code.**

### Install all three skills:

```bash
# 1. Design Taste — Prevents generic "AI slop" UI patterns
npx skills add Leonxlnx/taste-skill

# 2. UI/UX Pro Max — Design system intelligence for Claude Code
npx skills add nextlevelbuilder/ui-ux-pro-max-skill

# 3. Emil Kowalski's Skill — Animation, motion, and UI quality guidance
npx skills add emilkowalski/skill
```

### Verify installed skills:

```bash
npx skills list
```

You should see all three skills listed.

### What these do:
- **`taste-skill`** — Guides the AI to use stronger typography, spacing, and layout variety instead of generic patterns
- **`ui-ux-pro-max-skill`** — Provides a searchable database of UI styles, color palettes, and UX guidelines
- **`emilkowalski/skill`** — Enforces best-in-class animation and motion design principles

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (marketing)/          # Public-facing pages (homepage, menu, blog…)
│   ├── (admin)/admin/        # Internal admin panel
│   └── api/                  # REST API routes (MongoDB backend)
├── components/
│   ├── ui/                   # Atomic: Button, Card, Input, Badge…
│   ├── layout/               # Navbar, Footer, Sidebar
│   ├── sections/             # Page sections: Hero, FeaturedBeers…
│   └── admin/                # Admin-only components
├── lib/                      # mongodb.ts, blob.ts, utils.ts, seo.ts
├── models/                   # Mongoose models: Beer, BlogPost, Event, Contact
├── hooks/                    # React hooks: use-beers, use-scroll, use-media-query
├── types/                    # TypeScript interfaces: beer.ts, blog.ts, event.ts
└── config/                   # site.ts (brand config), fonts.ts (typography)
```

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 App Router, TypeScript |
| Backend | Next.js API Routes (Route Handlers) |
| Database | MongoDB + Mongoose |
| Image Storage | Vercel Blob |
| Deployment | Vercel |
| Fonts | Google Fonts via `next/font` |

---

## 🧑‍💻 Development Workflow

```bash
pnpm run dev      # Start dev server (http://localhost:3000)
pnpm run build    # Production build
pnpm run lint     # Run ESLint
```

---

## 📐 Design System

All design tokens live in [`src/app/globals.css`](./src/app/globals.css).
Use CSS custom properties (e.g. `var(--color-brand-500)`, `var(--text-xl)`) — never hardcode colors or font sizes.

Key tokens:
- **Colors:** `--color-brand-*` (amber), `--color-dark-*` (backgrounds), `--color-cream` (text)
- **Typography:** `--font-display` (headings), `--font-sans` (body), `--font-ui` (labels/buttons)
- **Spacing:** `--space-*` (1–32 scale)
- **Transitions:** `--transition-fast`, `--transition-base`, `--transition-slow`, `--transition-spring`

---

## 📬 Questions?

Reach out to the team at **hello@otterbeer.vn** or open a GitHub issue.
