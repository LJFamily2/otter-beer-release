# Component & Page Catalog

A single, sitewide inventory of every component and page/route that exists
on the OtterBeer site. Two purposes:

1. **Check before building.** Before adding a new page or component, search
   this document first — a similar one may already exist and just need a
   new prop (see the "customize via props" rule in `docs/component-library.md`)
   instead of a duplicate.
2. **Append when you add one.** When you add a new page, route, or reusable
   component — whether you're a human contributor or an AI agent — add one
   row to the relevant table below in the same PR/commit. Keep entries to
   one line; link to more detail (a doc, a prop reference) instead of
   duplicating it here.

This document tracks *what exists and where*, not *how to use it* — for
component props/variants see `docs/component-library.md`; for design tokens
see `docs/DESIGN.md`.

---

## Pages & routes — Admin (`src/app/(admin)/admin/`)

VI-only, session-gated by `src/proxy.ts`, permission-gated per-page via
`RouteGuard`/`session.user.permissions`.

| Route | File | Description |
|---|---|---|
| `/admin/dang-nhap` | `dang-nhap/page.tsx` | Login — Google OAuth sign-in, public (the one admin path proxy.ts exempts from the auth gate) |
| `/admin` | `(protected)/page.tsx` | Redirects to `/admin/blog` |
| `/admin/blog` | `(protected)/blog/page.tsx` | News & Blog list — KPI cards, `Breadcrumbs`, `DataTable` (search action + pagination footer) |
| `/admin/blog/moi` | `(protected)/blog/moi/page.tsx` | Create post — renders `PostForm` (Tiptap editor) |
| `/admin/blog/[id]/sua` | `(protected)/blog/[id]/sua/page.tsx` | Edit post — renders `PostForm` (Tiptap editor) |
| — | `(protected)/blog/PostForm.tsx` | Shared create/edit form — `Breadcrumbs`, `Tabs` (locale switcher), `Input`/`Textarea`/`Select` for every field |
| `/admin/hero` | `(protected)/hero/page.tsx` | Ảnh bìa trang chủ — singleton editor (not per-item CRUD) for the homepage hero carousel's ordered slide list; renders `HeroSlidesForm` |
| — | `(protected)/hero/HeroSlidesForm.tsx` | Whole-list editor — `Tabs` (locale switcher), add/remove/reorder slide cards, each with `MediaUploadField` (image **or** video, 16:9), a per-locale alt-text `Input`, and a per-slide draft/published `Select`; `PUT /api/hero-section` replaces the whole `slides` array in one save (same pattern as `BrandStoryForm`). Capped at `MAX_HERO_SLIDES` (`src/config/heroSlide.ts`) |
| `/admin/beers` | `(protected)/beers/page.tsx` | Sản phẩm bia (product) list — `DataTable` with dòng bia/thông số/nổi bật/trạng thái columns; at most one beer can be `isFeatured` (enforced in `BeerService`) — that one, if also `published`, is what renders on the public homepage hero |
| `/admin/beers/moi` | `(protected)/beers/moi/page.tsx` | Create product — renders `BeerForm` |
| `/admin/beers/[id]/sua` | `(protected)/beers/[id]/sua/page.tsx` | Edit product — renders `BeerForm` |
| — | `(protected)/beers/BeerForm.tsx` | Shared create/edit form — `Breadcrumbs`, `Tabs` (locale switcher: dòng bia/tiêu đề/mô tả), ABV/IBU inputs, `ImageUploadField`, shop/find-locally links, native color-swatch + hex `Input` pair for `themeColor`/`themeColorContainer` (optional, homepage showcase theming), `Checkbox` for "nổi bật" |
| `/admin/brand-story` | `(protected)/brand-story/page.tsx` | Câu chuyện thương hiệu — singleton editor (not per-item CRUD) for the homepage flipbook's ordered chapter list; renders `BrandStoryForm` |
| — | `(protected)/brand-story/BrandStoryForm.tsx` | Whole-list editor — `Tabs` (locale switcher), add/remove/reorder chapter cards, each with a localized title `Input` and an add/remove/reorder image grid (`ImageUploadField` per new upload); `PUT /api/brand-story` replaces the whole `chapters` array in one save (mirrors `PermissionMatrixEditor`'s whole-resource-replace pattern, not Beer's per-item PATCH). A chapter is a group of images sharing one localized title — matches `src/config/brandStoryChapters.ts`'s shape on the public side |
| `/admin/users` | `(protected)/users/page.tsx` | User Management — KPI cards (total/active/inactive), `Breadcrumbs`, role `Tabs` + search (client-side, `filterUsers()`), `DataTable`. Role dropdowns (invite/edit) are pre-filtered to roles the actor outranks — see `docs/rbac.md`'s "Role hierarchy" |
| — | `(protected)/users/UsersDirectory.tsx` | Client filtering/table piece of the Users page — a row whose user currently holds a peer/superior role shows "Vai trò cao hơn" instead of edit/delete actions |
| — | `(protected)/users/AddUserModal.tsx` | Invite a user — `Modal` + `Input`/`Select`, `POST /api/users` |
| — | `(protected)/users/EditUserModal.tsx` | Change a user's role/active state — `Modal` + `Select`, `PATCH /api/users/[id]` |
| — | `(protected)/users/DeleteUserButton.tsx` | Revoke a user's access — `DELETE /api/users/[id]` (mirrors `blog/DeletePostButton.tsx`) |
| `/admin/tai-khoan` | `(protected)/tai-khoan/page.tsx` | Account Settings — no Figma frame exists for this (self-designed): read-only profile (name/email/avatar synced from Google), role badge, permissions-matrix summary (`DataTable`, **superAdmin only** — everyone else's own grants aren't shown here), sign out |
| `/admin/roles` | `(protected)/roles/page.tsx` | Roles & Permissions — role list (`?roleId=` query param switches selection), permission matrix editor per role. superAdmin's row is shown as a static "always full access" notice (matches the API's edit block); a peer/superior role's matrix renders read-only (see `docs/rbac.md`'s "Role hierarchy") |
| — | `(protected)/roles/PermissionMatrixEditor.tsx` | Client checkbox grid (module × action) + save — `PUT /api/permissions` |
| — | `(protected)/roles/CreateRoleModal.tsx` | Create a custom role — `Modal` + `Input`, `POST /api/roles` (new role's rank is always `actorLevel + 1`, computed server-side) |
| — | `(protected)/roles/RenameRoleModal.tsx` | Rename a non-system role — `Modal` + `Input`, `PATCH /api/roles/[id]` |
| — | `(protected)/roles/DeleteRoleButton.tsx` | Delete a non-system role — `DELETE /api/roles/[id]` (system roles can't be deleted; the button is hidden for them, and for any role at or above the actor's rank) |
| — | `(protected)/layout.tsx` | Admin shell — `NavSidebar` (route-aware active state) + `Avatar`; footer profile block links to `/admin/tai-khoan`, trimmed to modules that actually have UI |

**Reserved, not yet built** (empty `.gitkeep` scaffold folder — a future
module, not a bug if you find nothing there): `admin/events/`.

## Pages & routes — Marketing (`src/app/[locale]/(marketing)/`)

Bilingual (vi default with no prefix, en under `/en`), public, SEO-tracked
(sitemap, JSON-LD — see `src/lib/seo.ts`).

| Route | File | Description |
|---|---|---|
| `/` | `page.tsx` | Homepage — renders `HeroSection` (ported from Figma node 28:877, "Main Hero Section" / the "Production List" section), then `BrandStorySection`, `TaglineSection`, `MarqueeSection`, `ProductShowcase`, `NewsBlogSection` and the contact form |
| `/blog` | `blog/page.tsx` | Public blog list ("Otter Beer Journal" / "Nhật Ký Bia Chú Rái Cá") — hero, featured post, tag filter, pagination |
| `/blog/[slug]` | `blog/[slug]/page.tsx` | Public blog detail — article body, author card, recent posts, topics, JSON-LD |
| `/design-system` | `design-system/page.tsx` | Live showcase of every `src/components/ui/*` component, grouped like the Figma "Coastal Premium UI Library" batches. `noindex` — internal tooling |
| `/contact` | `contact/page.tsx` | Contact page — renders `ContactSection` at `h1`, plus an Organization + Brewery + BreadcrumbList JSON-LD graph |
| `/privacy` | `privacy/page.tsx` | Privacy policy — bilingual, canonical + hreflang via `buildStaticPageMetadata` |
| `/terms` | `terms/page.tsx` | Terms of service — bilingual, canonical + hreflang via `buildStaticPageMetadata` |
| `/age-verification` | `age-verification/page.tsx` | Standalone age gate (`AgeVerificationGate layout="page"`). `noindex` + disallowed in `robots.ts` |
| — | `layout.tsx` | Marketing shell — `AgeGateWrapper`, header, and the footer (brand blurb, Explore nav, NAP block from `src/config/brand.ts`, legal links). The footer is the site's only crawl path to `/privacy`, `/terms` and `/contact` |
| — | `contact/Contact.tsx` | `ContactSection` — shared by `/contact` and the homepage; `headingLevel` prop picks `h1` (standalone) or `h2` (embedded) |

**Reserved, not yet built**: `about/`, `events/`, `menu/`.

## Special files (`src/app/`)

| File | Description |
|---|---|
| `layout.tsx` | Root layout — fonts, `<html lang>` via `getServerLocale()`, and the sitewide metadata base: `metadataBase`, title template, robots directives (`max-image-preview:large`, `max-snippet:-1`), icons, default OG/Twitter cards, `themeColor`. No header/footer (that's the marketing layout's job) |
| `sitemap.ts` | `/sitemap.xml` — every static marketing route in both locales plus one entry per published blog translation, each with `<xhtml:link>` hreflang alternates. Falls back to the static routes if the DB is unreachable |
| `robots.ts` | `/robots.txt` — disallows `/admin`, `/api/` and the `noindex` utility pages; explicitly admits the AI answer-engine crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, …) for GEO; points at the sitemap |
| `llms.txt/route.ts` | `/llms.txt` — plain-text brand facts, beer specs (ABV/IBU), FAQ and page index for LLM crawlers ([llmstxt.org](https://llmstxt.org)). Generated from `src/config/brand.ts`, `src/config/faq.ts` and `beerService`, so it cannot drift from the site. Revalidates hourly |
| `not-found.tsx` | 404 — handles both unmatched URLs anywhere in the app and any `notFound()` call from a segment without its own `not-found.tsx`. No header/footer (Figma "navigation shell suppressed" for error pages); bilingual via `getServerLocale()`. Recovery actions branch on `getServerAppSection()`: marketing links to `/` and `/blog`, admin uses `BackButton` (browser history, falls back to `/admin`) so a 404 inside the admin panel never sends the user out to the public site |
| `error.tsx` | 500 — root error boundary (Client Component) for runtime errors below the root layout; "Try Again" (`retry()`) and a `mailto:` support link; bilingual via `getClientLocale()`. A failure inside the root layout itself would need `global-error.tsx`, which doesn't exist yet |

## Reusable UI components (`src/components/ui/`)

Full prop reference: `docs/component-library.md`. One-line summary of what
exists, so you don't have to open every file to check:

Button, BackButton, Input, Textarea, Select, Checkbox, Card, FeatureCard,
Badge, StatusBadge, Avatar/AvatarGroup, DataTable, Accordion, ActivityList,
Breadcrumbs, Tabs, Pagination, NavSidebar, TopNavBar, DropdownMenu, Modal,
Alert, Toast, Tooltip, Spinner, Skeleton, AgeVerificationGate,
CookieConsent, plus a shared generic icon set (`icons.tsx`).

## Marketing section components (`src/components/sections/`)

Homepage/public-page building blocks, one Figma frame per component.

| Component | File | Description |
|---|---|---|
| `HeroSection` | `HeroSection.tsx` | Homepage hero carousel ("Production List" section, Figma node 28:877). Client Component, receives `slides: HeroSlideItem[]` as a prop (built server-side in `page.tsx` via `heroSectionService.listPublishedSlides()` + `HeroSectionPresenter.toSlideItem()`). Falls back to a small static sample set when the prop is omitted or empty, so the section is never blank. Drag/swipe + segmented gold progress indicators, no arrow controls; autoplay pauses on drag, backgrounded tab, and keyboard focus; cross-fades with autoplay off under `prefers-reduced-motion`; a `mediaType: "video"` slide renders an autoplaying, muted, looping `<video>` instead of `next/image`. Indicator fill keyframes live in `globals.css` as `.hero-indicator-fill`. Takes an optional `locale` and renders the homepage's single `<h1>` as `sr-only`: the hero stays image-only by design (no type over the photography), but the page still needs one statement of what it is for crawlers and screen readers — see `docs/seo.md` |
| `NewsBlogSection` | `NewsBlogSection.tsx` | Homepage news & blog rail, sits directly under `ProductShowcase` — no Figma frame (self-designed, layout ported from the hoiana.com/vn editorial band and re-themed to Coastal Premium). Client Component, receives `posts: NewsCardItem[]` as a required prop (built server-side in `page.tsx` via `blogPostService.getRecentPublished()` + `BlogPostPresenter.toNewsCardItem()`); the page mounts the section only when `posts.length > 0` (same convention as `ProductShowcase`/`beers`) rather than the component self-guarding, since its scroll-linked parallax is bound to its own root ref and breaks if that root never mounts. Full-bleed `bg-primary` navy band, two-column masthead (Anton heading + standfirst), and a snap-scrolling card rail inset to the container gutter that bleeds past the right edge. Cards are Playfair-italic titles over a photo scrim with an optional tag pill (each post's first `tags[]` entry, verbatim — tags are locale-agnostic across the app); pointer users get floating prev/next controls (disabled at each bound), touch users swipe. Each card links to its own post at `/blog/[slug]`, locale-prefixed |
| `BrandStorySection` | `BrandStorySection.tsx` | Homepage "brand story" flipbook — no Figma frame exists for this (self-designed, original SVG illustrations/decorative motifs, no source art files). Client Component (page-turn interaction). Splits into `BrandStoryDesktop` (dark stage, hardcover book, full-height chapter page-edge tabs down the right) and `BrandStoryMobile` (its own light single-image carousel — a separate design, deliberately not unified, reduced to the book's first 4 chapters). Both receive an optional `chapters: BrandStoryChapter[]` prop (built server-side in `page.tsx` via `brandStoryService.getPublished()` + `BrandStoryPresenter.toBookChapters()`) and independently fall back to `src/config/brandStoryChapters.ts`'s static sample book when it's omitted or empty, so neither variant is ever blank. A chapter is a **group** of images sharing one title, laid out into two-page spreads by `buildBrandStoryBook()`: a 3-image chapter takes two spreads of turning before the next tab becomes current; odd chapters get one blank padding leaf so each opens on a left page |
| `MarqueeSection` | `MarqueeSection.tsx` | Homepage brand marquee, sits directly under `TaglineSection` — styled off Figma node `153-544` ("Otter Beer Redesign"), matched from screenshots (no live MCP fetch was available when this was built, so exact spacing/tokens are approximated, not pulled). Server Component, pure CSS: a diagonal (`-rotate-2`), near-white (`bg-surface-container-lowest`) band of two tightly-stacked, independently looping rows — a bold `OTTER BEER` brand row and a smaller, muted (`text-primary-container/70`) tagline row, both `font-display` — scrolling in opposite directions at different speeds via `.marquee-track` keyframes in `globals.css`, each edge-masked with `.marquee-fade-mask`. Frozen under `prefers-reduced-motion`. Separator icons (`DropletIcon`/`SparkleIcon`) are hand-authored SVGs local to the component, same convention as `BrandStorySection`'s decorative motifs |
| `FaqSection` | `FaqSection.tsx` | Homepage FAQ — the site's AEO surface, sits between `NewsBlogSection` and `ContactSection`. Server Component built on native `<details>`/`<summary>` (not a JS accordion) so every answer ships in the server-rendered HTML whether or not the item is open. Content comes from `src/config/faq.ts`, which also feeds the `FAQPage` JSON-LD on the homepage — visible copy and markup are the same strings by construction. Anchored at `#faq` |
| `ProductShowcase` | `ProductShowcase.tsx` | Homepage product carousel — Client Component, receives `beers: BeerShowcaseItem[]` as a prop (built server-side in `page.tsx` via `beerService.listShowcasePublished()` + `BeerPresenter.toShowcaseItem()`, one entry per `status: "published"` Beer, newest first). Section is omitted entirely when there are zero published beers. Per-beer `themeColor`/`themeColorContainer` (admin-set hex fields on `Beer`, editable in `BeerForm`) drive the section's `--color-primary`/`--color-primary-container` CSS vars; fall back to the brand default (`DEFAULT_THEME_COLOR`/`DEFAULT_THEME_COLOR_CONTAINER` in `src/config/beer.ts`) when unset. Shop/find-locally CTAs are hidden individually when a beer has no `shopUrl`/`findLocallyUrl`; prev/next nav is hidden when only one beer is published. Product variants (`Beer.variants` — an image plus a per-locale short name; packaging is the motivating case, e.g. lon / bao bì 6 lon / thùng 24 lon, but the field is not packaging-specific — edited in `BeerForm` under “Phiên bản sản phẩm”) render as a row of sharp rectangular pills under the can; picking one swaps the hero image. The pills inherit the section's `--color-primary`, so they recolor per beer. The row leads with the beer's main `imageKey` (labelled by `Beer.imageNames`, required once variants exist) and is followed by each variant, so a visitor switches between the main shot and the packs; the main image is selected by default. Shown on every breakpoint whenever the beer has at least one variant; a beer with none renders its main `imageKey` with no picker at all, exactly as before. `imageSrc` stays the main image either way, so the Product JSON-LD in `src/lib/seo.ts` is unaffected |

## Analytics components (`src/components/analytics/`)

Consent-gated measurement. Deliberately separate from `ui/` — these render no
visible interface and exist purely to enforce an ordering guarantee.

| Component | File | Description |
|---|---|---|
| `Analytics` | `Analytics.tsx` | Google Analytics behind Google Consent Mode v2. Renders nothing unless `NEXT_PUBLIC_GA_ID` is set. Emits, in order: a plain inline `<script>` registering every consent signal as `denied` with `wait_for_update`, then `<GoogleAnalytics>` (gtag.js, `afterInteractive`), then `<ConsentSync>`. Mounted first inside `<body>` in `src/app/layout.tsx` so the denied default is parsed before the tag is injected. Uses a raw inline script rather than `next/script`'s `beforeInteractive`, which Next requires to live literally inside `app/layout.tsx` — see the comment in the file |
| `ConsentSync` | `ConsentSync.tsx` | Client Component, renders `null`. Replays an already-stored consent decision into Consent Mode on mount, so a returning visitor who accepted analytics is not stuck on the denied default forever — the banner never reappears for them, so nothing else would push an update |

## Admin-only components (`src/components/admin/`)

Not part of the general-purpose UI kit — admin-specific pieces that assume
the admin shell/session context.

| Component | File | Description |
|---|---|---|
| `RichTextEditor` | `RichTextEditor.tsx` | Tiptap WYSIWYG editor used by the blog post form |
| `ImageUploadField` | `ImageUploadField.tsx` | Signed-upload image field, square preview, image-only (cover image, inline post images, beer artwork, brand-story pages). Takes a `namespace` prop deciding both the storage folder and which module's permission authorizes the upload — see `src/lib/storage/namespaces.ts` |
| `MediaUploadField` | `MediaUploadField.tsx` | Signed-upload field that accepts an image **or** a video, previews either on a 16:9 stage, and (with `warnOnNon16x9`) warns — without blocking — when the picked file isn't 16:9. Reports `{key, mediaType}` back. Used by `HeroSlidesForm`; deliberately a sibling of `ImageUploadField` rather than a variant, since that field is image-only and three other forms depend on its current shape |
| `icons.tsx` | `icons.tsx` | Admin-specific icon set (news/blog, beer, users, shield, logout, plus, search, edit, trash) |
| `classNames.ts` | `classNames.ts` | Shared Tailwind class strings reused across admin server/client component boundaries |

**Retired**: `AdminNavLink.tsx` — superseded by `src/components/ui/NavSidebar.tsx`'s
own route-aware active-state detection (see the Navigation entry above).

---

## Maintenance

- Adding a page/route → add a row to the matching table above.
- Adding a `src/components/ui/*` component → add its name to the one-line
  summary list above **and** a full entry in `docs/component-library.md`.
- Adding a `src/components/admin/*` component → add a row to the admin
  table above.
- Adding a `src/components/analytics/*` component → add a row to the
  analytics table above.
- Retiring/deleting something → remove its row in the same change, don't
  leave a stale entry.
