# Internationalization (i18n)

## Strategy

OtterBeer supports **two languages**: Vietnamese (VI) and English (EN).

| Scope | Languages | Notes |
|---|---|---|
| Marketing site | VI + EN | Customer-facing pages |
| Admin panel UI (chrome, labels, nav) | VI only | Internal tool — static Vietnamese strings, not driven by a dictionary system |
| Content data entered in the admin (news & blog today) | VI + EN, extensible | Per-field "multi-language input" — see [Content Translations](#content-translations-multi-language-input-fields) below. This is a *separate* concern from the two rows above. |
| API responses | English | Error messages and field names |

**These are two unrelated i18n systems that happen to share the word "language":**
1. **Site/UI language** (this section, above) — which strings a *human viewing a page* sees. Admin UI is always Vietnamese.
2. **Content language** (below) — which languages a *piece of content* (a blog post) has been written in. This is what "make sure it has space for multi-language input in the admin side" refers to, and it's independent of what language the admin's own UI is in.

---

## URL Routing Convention

| URL | Language | Example |
|---|---|---|
| `otterbeer.vn/` | 🇻🇳 Vietnamese (default) | `otterbeer.vn/menu` |
| `otterbeer.vn/en/` | 🇬🇧 English | `otterbeer.vn/en/menu` |

**Rules:**
- Vietnamese is the **default locale** — no path prefix, just the bare domain
- English uses the `/en/` prefix
- Admin routes (`/admin/*`) are never localized

---

## App Router i18n Structure

With Next.js App Router, there are two approaches. We use **Middleware + `[locale]` dynamic segment**:

```
src/app/
├── [locale]/                    ← Dynamic locale segment (vi | en)
│   ├── layout.tsx               ← Sets html lang attribute
│   ├── page.tsx                 ← Localized homepage
│   ├── menu/
│   │   └── page.tsx
│   ├── about/
│   ├── events/
│   ├── blog/
│   └── contact/
├── (admin)/                     ← Not localized (outside [locale])
│   └── admin/
└── api/                         ← Not localized
```

**Routing behavior:**
- `otterbeer.vn/` → `[locale]` = `vi` (set by middleware)
- `otterbeer.vn/en/menu` → `[locale]` = `en`
- `otterbeer.vn/admin` → no locale, bypasses i18n middleware

---

## Proxy (formerly Middleware)

Next.js 16 renamed the `middleware.ts` file convention to `proxy.ts` (functionally identical — see `node_modules/next/dist/docs/.../file-conventions/proxy.md`). This project's `src/proxy.ts` is already implemented and combines two concerns: the locale rewrite described here, and the admin auth gate described in [authentication.md](./authentication.md).

It:
1. Serves `/admin/*` and `/api/*` untouched (no locale rewriting there)
2. Passes through requests that already have a `/vi` or `/en` prefix
3. Rewrites everything else to `/vi/...` internally, so the bare domain serves Vietnamese with no visible prefix

```typescript
// src/proxy.ts (excerpt — see the real file for the auth-gate half)
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { SUPPORTED_LOCALE_CODES, DEFAULT_LOCALE } from "@/config/locales";

export default auth((request) => {
  const { pathname } = request.nextUrl;
  // ...admin auth gate omitted here, see src/proxy.ts...

  const isLocalized = SUPPORTED_LOCALE_CODES.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );
  if (isLocalized) return NextResponse.next();

  return NextResponse.rewrite(new URL(`/${DEFAULT_LOCALE}${pathname}`, request.url));
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

`SUPPORTED_LOCALE_CODES` and `DEFAULT_LOCALE` are read from `src/config/locales.ts` — the same registry used for content translations below, so the marketing site's language list and the admin's content-language list never drift apart.

---

## Translation Files

Translations live in `src/i18n/` (to be created):

```
src/
└── i18n/
    ├── vi.ts          ← Vietnamese strings (default)
    ├── en.ts          ← English strings
    └── index.ts       ← getDictionary() helper
```

### Dictionary structure
```typescript
// src/i18n/vi.ts
export const vi = {
  nav: {
    home: "Trang chủ",
    menu: "Thực đơn",
    events: "Sự kiện",
    blog: "Blog",
    about: "Giới thiệu",
    contact: "Liên hệ",
  },
  home: {
    hero: {
      headline: "Mỗi cốc bia là một câu chuyện",
      cta: "Khám phá thực đơn",
    },
  },
  // ...
};
```

```typescript
// src/i18n/en.ts
export const en = {
  nav: {
    home: "Home",
    menu: "Menu",
    events: "Events",
    blog: "Blog",
    about: "About",
    contact: "Contact",
  },
  home: {
    hero: {
      headline: "Every pint tells a story",
      cta: "Explore our menu",
    },
  },
  // ...
};
```

### getDictionary() helper
```typescript
// src/i18n/index.ts
import type { Locale } from "@/middleware";

const dictionaries = {
  vi: () => import("./vi").then((m) => m.vi),
  en: () => import("./en").then((m) => m.en),
};

export async function getDictionary(locale: Locale) {
  return dictionaries[locale]?.() ?? dictionaries.vi();
}
```

### Usage in a Server Component
```typescript
// src/app/[locale]/page.tsx
import { getDictionary } from "@/i18n";

export default async function HomePage({
  params,
}: PageProps<"/[locale]">) {
  const { locale } = await params;
  const t = await getDictionary(locale as "vi" | "en");

  return <h1>{t.home.hero.headline}</h1>;
}
```

---

## Language Switcher Component

A client-side `<LanguageSwitcher>` button will:
- Read the current URL
- Swap between `domain.com/current-path` ↔ `domain.com/en/current-path`
- Set a `NEXT_LOCALE` cookie for future visits

```typescript
// Conceptual — build in components/ui/LanguageSwitcher.tsx
"use client";
import { usePathname, useRouter } from "next/navigation";

export function LanguageSwitcher({ currentLocale }: { currentLocale: "vi" | "en" }) {
  const pathname = usePathname();
  const router = useRouter();

  const toggleLocale = () => {
    if (currentLocale === "vi") {
      router.push(`/en${pathname}`);
    } else {
      // Remove /en prefix
      router.push(pathname.replace(/^\/en/, "") || "/");
    }
  };

  return (
    <button onClick={toggleLocale}>
      {currentLocale === "vi" ? "EN" : "VI"}
    </button>
  );
}
```

---

## SEO Considerations

For bilingual SEO, each page should declare `hreflang` alternate links:

```typescript
// In each page's generateMetadata:
export const metadata: Metadata = {
  alternates: {
    canonical: "https://otterbeer.vn/menu",
    languages: {
      "vi": "https://otterbeer.vn/menu",
      "en": "https://otterbeer.vn/en/menu",
    },
  },
};
```

The `buildSEO()` helper in `src/lib/seo.ts` will be extended to accept a `locale` parameter and generate these automatically. Each `translations[]` entry on a `BlogPost` already carries its own `seoTitle`/`seoDescription`/`seoKeywords`/`ogImageKey`, so per-language SEO metadata is already modeled at the data layer — see [database-schema.md](./database-schema.md#blogposts).

---

## Content Translations (multi-language input fields)

This is the system behind "make sure the admin has space for multi-language input, flexible for future languages." It's implemented and in use by the News & Blog module today.

### The registry: `src/config/locales.ts`

```typescript
export const LOCALES = [
  { code: "vi", label: "Tiếng Việt", required: true },
  { code: "en", label: "Tiếng Anh", required: false },
] as const;

export const DEFAULT_LOCALE: LocaleCode = "vi";
```

**To add a third language later** (e.g. Japanese), add one entry to this array. Nothing else changes:
- `BlogPost.translations` is an array of `{ locale, title, slug, ... }` subdocuments, not a fixed set of fields — a new locale is just a new array entry per post, no migration.
- `BlogPostTranslationInputSchema` (`src/lib/validation/blogPost.ts`) validates `locale` against this same registry, so the new code is accepted automatically.
- The admin content form (frontend work, not yet built) should render one input group per entry in `LOCALES`, so a new language shows up as a new tab/section automatically.

### Required vs optional languages

`required: true` (Vietnamese) means `BlogPostCreateSchema`'s `superRefine` rejects a post missing that language's content — see `validateTranslationSet` in `src/lib/validation/blogPost.ts`. English is optional: a post can be Vietnamese-only.

### Per-language slugs

Slugs are unique **per locale**, not globally — `translations.locale` + `translations.slug` is a compound unique index (see [database-schema.md](./database-schema.md#indexes)), so the Vietnamese and English versions of the same post can use unrelated slugs. `SlugGenerator` (`src/lib/utils/SlugGenerator.ts`) auto-generates one from the title when omitted, including stripping Vietnamese diacritics (`đ`/`Đ` and combining marks) into a clean ASCII slug.

---

## Implementation Checklist

Site/UI language routing (marketing pages):
- [ ] Build out `src/app/[locale]/(marketing)/` pages (folder structure already scaffolded)
- [x] Locale rewrite logic — implemented in `src/proxy.ts`
- [ ] Create `src/i18n/vi.ts` (Vietnamese strings)
- [ ] Create `src/i18n/en.ts` (English strings)
- [ ] Create `src/i18n/index.ts` with `getDictionary()`
- [ ] Update `src/lib/seo.ts` to generate `hreflang` alternates
- [ ] Build `<LanguageSwitcher>` component
- [ ] Add `lang` attribute to `<html>` in `[locale]/layout.tsx`

Content translations (admin data entry):
- [x] `src/config/locales.ts` locale registry
- [x] `BlogPost.translations[]` schema + per-locale slug uniqueness
- [x] `SlugGenerator` (Vietnamese-diacritic-aware)
- [ ] Admin form UI: one input group per `LOCALES` entry (frontend work)
