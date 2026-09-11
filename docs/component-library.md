# Coastal Premium Component Library

Reusable UI components live in `src/components/ui/`. They implement the
"Coastal Premium" design system (see `docs/DESIGN.md` and the `@theme`
tokens in `src/app/globals.css`) and back the public showcase page at
`/design-system`.

## The rule: customize via props, not by editing components

**When a page needs a component to look or behave differently, add a prop
or pass different children/data — do not edit the component file.**

Why: these components are shared across the admin panel, the marketing
site, and any future module. An edit made "just for this one page" silently
changes every other place that imports the component, and is the kind of
regression that's hard to trace back to its cause.

How to apply it:
- Need a new visual treatment? Check if an existing variant prop covers it
  (e.g. `Button`'s `variant`/`size`, `FeatureCard`'s `variant`). If not, add
  a new variant to the component's type union and its class-map constant —
  that's still "adding a parameter," not rewriting the markup.
  Additive changes to a component's classes still fall under this rule: adding
  a token to that map is expected maintenance, not a one-off override.
- Need different content/data? Pass it through props (`items`, `columns`,
  `rows`, `children`, render functions) — every list/table/menu component
  here is driven by an array or render-prop, not hardcoded rows.
- Need a one-off tweak to spacing/color for a single call site? Use the
  component's `className` prop (all of them accept one) rather than
  duplicating the component.
- Only touch a component file itself for genuine bug fixes, or when adding
  a new prop/variant that legitimately belongs to every consumer.

Each component file repeats this rule in a short header comment.

## Components

### Buttons & form fields
- **`Button`** (`Button.tsx`) — `variant: "primary" | "secondary"`, `size: "sm" | "md" | "lg"`, plus all native `<button>` props. `buttonVariants(variant, size)` exports the class string for styling a `<Link>` identically to a button.
- **`BackButton`** (`BackButton.tsx`, client) — `label`, `fallbackHref`, `variant?`, `size?`. Returns via browser history (`router.back()`), falling back to `fallbackHref` when there's no history (e.g. the tab's first navigation landed directly here). Used by the admin-context 404 (`src/app/not-found.tsx`) instead of a link back into the public site.
- **`Input`** (`Input.tsx`) — `label?`, `icon?` (leading icon node), `error?`, `hint?`, plus native `<input>` props.
- **`Textarea`** (`Textarea.tsx`) — `label?`, `error?`, `hint?`, `rows?`, plus native `<textarea>` props.
- **`Select`** (`Select.tsx`, client) — `label?`, `options: {value, label}[]`, `placeholder?`, `error?`, `value?`/`defaultValue?`, `onChange?: (value: string) => void`, `name?`, `required?`, `disabled?`. A custom-rendered listbox, not a native `<select>` — a native select's options popup is drawn by the browser/OS and can't be restyled via CSS at all, so this renders its own styled panel instead (closes on outside click/Escape/pick; Up/Down navigate while open). `onChange` receives the picked value directly, not a change event.
- **`Checkbox`** (`Checkbox.tsx`) — `label?`, `error?`, plus native `<input type="checkbox">` props. Unlike `Select`, a checkbox's own rendering has no browser-drawn popup, so it's styled directly on the native input — no custom rebuild needed.

### Status & content
- **`Badge`** (`Badge.tsx`) — `variant: "neutral" | "primary" | "outline" | "overlay"`. Plain text pill (post status, tags).
- **`StatusBadge` / `StatusDot`** (`StatusBadge.tsx`) — `StatusBadge`: `tone: "pending" | "active" | "featured" | "alert"`, optional `icon` override. `StatusDot`: `color: "success" | "warning" | "error"`, a small inline dot for table cells.
- **`Avatar` / `AvatarGroup`** (`Avatar.tsx`) — `Avatar`: `src?`, `initials?`, `size: "sm" | "md" | "lg"`, `online?` status dot. `AvatarGroup`: `items: {src?, initials?}[]`, `max?` before overflow.
- **`FeatureCard`** (`FeatureCard.tsx`) — `variant: "standard" | "premium" | "dark"`, `eyebrow?`, `title`, `description`, `imageSrc?`, `cta?: {label, href?, onClick?}`, `footer?`.
- **`Card`** (`Card.tsx`) — bare bordered/shadowed surface primitive; compose your own padding/content inside it.

### Data & lists
- **`DataTable<T>`** (`DataTable.tsx`) — `title?`, `action?`, `columns: {key, header, align?, render: (row: T) => ReactNode}[]`, `rows: T[]`, `rowKey`, `footer?` (e.g. a result-count summary + `Pagination`). Column rendering is entirely prop-driven. Used by the admin blog list (`src/app/(admin)/admin/(protected)/blog/page.tsx`).
- **`Accordion`** (`Accordion.tsx`, client) — `items: {question, answer}[]`, `defaultOpenIndex?`. Single-open FAQ pattern.
- **`ActivityList`** (`ActivityList.tsx`) — `items: {icon, iconBgClassName?, title, subtitle, timestamp}[]`, `footer?`.

### Navigation
- **`Breadcrumbs`** (`Breadcrumbs.tsx`) — `items: {label, href?}[]`; the last item (no `href`) renders as the current page. Used on the admin blog list and post form.
- **`Tabs`** (`Tabs.tsx`, client) — `items: {value, label: ReactNode}[]`, `variant: "underline" | "pill" | "segmented"`, controlled (`value` + `onChange`) or uncontrolled (`defaultValue`). `label` accepts a `ReactNode` (not just a string) so a tab can carry a marker like a required-field asterisk — see the admin post form's locale switcher. `segmented` fills the selected tab with `--color-primary` (white label) on a neutral track and glides that fill between tabs with a damped spring, honouring `prefers-reduced-motion`; because the fill is a token, a section that overrides `--color-primary` gets the control in its own colour — see `ProductShowcase`'s variant picker. Wrap it in framer-motion's `<LayoutGroup id={...}>` when several segmented Tabs mount and unmount in the same place (e.g. one per carousel slide), otherwise the fill animates across from the outgoing control.
- **`Pagination`** (`Pagination.tsx`) — `page`, `totalPages`, `buildHref: (page) => string`, `variant: "compact" | "pill"`.
- **`NavSidebar`** (`NavSidebar.tsx`, client) — `header?`, `items: {label, icon, href, active?}[]`, `footer?`. Highlights the item matching the current route automatically (via `usePathname()` + `isNavItemActive()`); pass `active` on an item to override — used by the design-system demo, whose `href`s are `"#"` placeholders. Powers the real admin sidebar (`src/app/(admin)/admin/(protected)/layout.tsx`).
- **`TopNavBar`** (`TopNavBar.tsx`) — `brand: {label, href}`, `links: {label, href, active?}[]`, `action?`. Distinct from the real marketing header (`src/app/[locale]/(marketing)/layout.tsx`), which stays hand-authored for that route group.
- **`DropdownMenu`** (`DropdownMenu.tsx`, client) — `trigger`, `header?: {title, subtitle?}`, `items: {label, description?, href?, onClick?, icon?, trailing?, danger?, active?, featured?, dividerBefore?}[]`. `description` adds a second line (icon+title+description rows); `active` highlights the current item (tinted background + left accent border); `featured` renders a solid-fill CTA row (e.g. a "Book a Table" style highlight) — pair it with `trailing` for an arrow/chevron. Closes on outside click / Escape.

### Feedback & overlays
- **`Modal`** (`Modal.tsx`, client) — `open`, `onClose`, `icon?`, `title`, `description?`, `cancelLabel?`, `confirmLabel?`, `confirmDisabled?` (e.g. while an async `onConfirm` submit is in flight), `onConfirm?`, `children?`. Fully controlled — the caller owns the `open` state (see `src/app/[locale]/(marketing)/design-system/ModalDemo.tsx` for the pattern, or `(admin)/admin/(protected)/users/AddUserModal.tsx` for a real async-submit form-in-a-modal).
- **`Alert`** (`Alert.tsx`) — `variant: "info" | "success" | "warning" | "error"`, `title`, `description?`, `icon?`.
- **`Toast`** (`Toast.tsx`) — `icon?`, `message`, `onClose?`. Presentational only — no stacking/auto-dismiss queue; compose your own positioning wrapper around it.
- **`Tooltip`** (`Tooltip.tsx`) — `label`, `side: "top" | "bottom"`, `children`. CSS-only (`:hover`/`:focus-within`), no JS.
- **`Spinner`** (`Spinner.tsx`) — `variant: "hop" | "pour" | "ripple"`, `label?`.
- **`Skeleton` / `SkeletonCard`** (`Skeleton.tsx`) — `Skeleton`: `width?`, `height?`, `rounded?`, the loading-placeholder primitive. `SkeletonCard` is an example composition, not a one-size-fits-all placeholder.

### Icons
`src/components/ui/icons.tsx` — hand-drawn generic stroke icons (search, chevrons, close, check/alert/info circles, shield, user, settings, logout, cart, menu, clipboard, box, bar-chart). Not sourced from Figma exports — these are simple generic glyphs, matching the same convention as `src/components/admin/icons.tsx`. Add a new icon here rather than inlining SVG at a call site.

## Showcase page

`/design-system` (`src/app/[locale]/(marketing)/design-system/page.tsx`)
assembles every component above into one reference page, grouped the same
way the original Figma "Coastal Premium UI Library" file is: Buttons &
Forms, Cards/Tables/Avatars/Accordions, Navigation, Feedback & Overlays.
Update this page's demo props/content when a component's public prop shape
changes, so it stays an accurate live reference.
