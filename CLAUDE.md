@AGENTS.md

# OtterBeer — AI Agent Rules

## MANDATORY: Test-First Workflow

Every AI agent making code changes to this repo **MUST** follow this exact sequence.
Skipping any step is not acceptable.

```
1. READ   → Read existing tests for the area you're changing
2. RUN    → Run pnpm test to confirm baseline passes
3. CHANGE → Make the requested changes
4. TEST   → Write new or updated tests for the changes
5. VERIFY → Run pnpm test && pnpm run test:e2e to confirm all pass
```

**No change should reduce test coverage.**
If a test cannot be written for a change, add a `// TODO: test` comment explaining why.

## MANDATORY: Security Checklist (per change)

Before submitting any change that touches user data or API routes:
- [ ] Input validated with Zod schema
- [ ] Route protected by correct role in middleware
- [ ] No secrets in client-side code (`NEXT_PUBLIC_*` only)
- [ ] No tokens stored in `localStorage` — use httpOnly cookies only
- [ ] HTML content sanitized before DB write (DOMPurify)

→ Full security guide: `docs/security.md`
→ Full testing guide: `docs/testing.md`

## MANDATORY: Keep pages crawlable

Everything a search engine or LLM needs must be in the **server-rendered
HTML** — not the RSC payload, not after hydration. Before shipping a public
page: `curl` it, strip `<script>` blocks, and check the content is still there.

Brand facts (NAP, socials, FAQ) live in `src/config/brand.ts` and
`src/config/faq.ts` — read from those, never restate them, so visible copy and
structured data cannot disagree.

→ Full SEO/AEO/GEO guide: `docs/seo.md`

## MANDATORY: Reusable UI components — customize via props, not by editing

`src/components/ui/*` is a shared component library (Button, Input, Card,
FeatureCard, DataTable, Modal, Alert, etc.), used across admin and
marketing pages. When a page needs different styling, content, or
behavior from one of these, **add/use a prop — do not edit the component
file** unless the change is a genuine bug fix or a new prop/variant that
belongs to every consumer.

→ Full component reference (props, variants, the reasoning behind this rule): `docs/component-library.md`

## MANDATORY: Check the component catalog before building something new

Before creating a new page or component, check `docs/component-catalog.md`
— a sitewide inventory of every existing page/route and component. A
similar one may already exist. **When you add a new page, route, or
reusable component, append one line to the matching table in that
document in the same change** — it only stays useful if it stays current.

## MANDATORY: File Naming Convention (Capital Case / PascalCase)

All component and section file names **MUST** be written in Capital Case (PascalCase), e.g. `Contact.tsx`, `Header.tsx`, `HeroSection.tsx`.

