# 🦦 Otter Beer

> Craft beer website for **otterbeer.vn** — built with Next.js 15, MongoDB, and Vercel Blob.

## Getting Started

See **[ONBOARDING.md](./ONBOARDING.md)** for the full setup guide.

```bash
pnpm install
cp .env.example .env.local  # Fill in your values
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

- **Frontend/Backend** — Next.js 15 (App Router, TypeScript)
- **Database** — MongoDB + Mongoose
- **Image Storage** — Vercel Blob
- **Deployment** — Vercel

## Project Structure

```
src/
├── app/           # Pages, layouts, and API routes
├── components/    # UI components (ui/, layout/, sections/, admin/)
├── lib/           # MongoDB, Blob, utils, SEO helpers
├── models/        # Mongoose models
├── hooks/         # React hooks
├── types/         # TypeScript interfaces
└── config/        # Site config & fonts
```

## Scripts

```bash
pnpm run dev    # Development server
pnpm run build  # Production build
pnpm run lint   # ESLint
```
