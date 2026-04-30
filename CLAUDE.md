@AGENTS.md

# NJIT Fencing Alumni Memories

A roster-gated archive for NJIT Highlanders fencing athletes, alumni, and coaches to publish and read team memories. Public reads of published memories; writes restricted to people on the roster.

## Stack

- **Next.js 16.2** (App Router, React 19.2, Server Components + Server Actions). Uses View Transitions via `next-view-transitions`.
- **Supabase** (`@supabase/ssr` + `@supabase/supabase-js`) for auth (magic link), Postgres, storage. Local dev on port 54321 (API), 54322 (DB, Postgres 17).
- **Tailwind v4** with CSS-native `@theme` tokens (no `tailwind.config`). PostCSS via `@tailwindcss/postcss`.
- **Tiptap 3** (StarterKit + Image, Link, Placeholder, Typography, CharacterCount) for the memory editor.
- **Radix UI** primitives + **shadcn-style** wrappers in `components/ui/` (button, dialog, drawer, popover, dropdown, alert-dialog, tooltip, avatar, carousel, label, input, textarea, skeleton). `cmdk` for the command palette. `vaul` for the mobile drawer. `sonner` for toasts. `motion` (Framer Motion successor) with `LazyMotion` + `domAnimation`. `next-themes` for light/dark.
- **Forms**: `react-hook-form` + `@hookform/resolvers` + `zod`.
- **Tooling**: ESLint 9 (`eslint-config-next`), Prettier, Husky + lint-staged, commitlint (conventional), Vitest. `tsc --noEmit` for type check.

## Next 16 conventions to respect

This is **not** the Next.js most training data covers. Things that will bite:

- **Edge middleware is named `proxy.ts`** at the repo root, not `middleware.ts`. The export is `proxy(request)`. See `proxy.ts` and `lib/supabase/middleware.ts`.
- `cookies()`, `headers()`, `params`, and `searchParams` are **all async** (Promise-typed). Always `await`.
- Server Actions with `bodySizeLimit: "6mb"` configured in `next.config.ts` (avatars / covers).
- Read deprecation notes from `node_modules/next/dist/docs/` before adopting an API you remember from older Next.

## Routing map

```
app/
  layout.tsx                 root: ViewTransitions, fonts (Fraunces, Inter Tight, JetBrains Mono), Providers
  globals.css                Tailwind v4 + brand tokens
  (app)/                     authed app shell (TopNav)
    layout.tsx
    page.tsx                 marketing home
    memories/
      page.tsx               masonry feed (public reads, FAB if authed)
      new/                   server action + Tiptap client editor
      [id]/page.tsx          memory detail (public read)
    profile/
      me/page.tsx            redirects to /profile/<slug>
      [handle]/page.tsx      public profile (signed-in viewers)
      edit/                  RHF + zod, avatar upload
    admin/
      roster/                admin-only CRUD + AlertDialog delete
      audit/                 last 200 roster_audit rows w/ diff
  login/                     magic link request + status
  auth/callback/route.ts     OTP verify + code exchange, profile gate
  onboarding/                4-step wizard: class → identity → avatar → bio
  not-on-roster/             dead-end for non-roster sign-ins
```

`proxy.ts` enforces: public paths (`/`, `/login`, `/auth/callback`, `/not-on-roster`, `/memories`) — everything else needs auth. `/memories/new` is a gated exception. After auth, missing profile → `/not-on-roster` (and signs out); missing `onboarded_at` → `/onboarding/class`; onboarded users hitting `/login` or `/onboarding/*` → `/profile/me`.

## Data model (Supabase, all migrations applied in `supabase/migrations/`)

- `member_role` enum: `athlete | alumni | coach`.
- `roster (email PK, role, class_year, full_name, invited_at, claimed_at)` — RLS denies anon/authenticated; admins (via `is_admin(uid)` SECURITY DEFINER helper) can CRUD. Service role bypasses.
- `profiles (id PK = auth.users.id, email FK→roster.email, role, class_year, full_name, major, avatar_path, bio, slug UNIQUE, onboarded_at, is_admin, created_at, updated_at)` — created on first sign-in by `handle_new_user()` trigger if email is on roster; else trigger no-ops and middleware bounces them. Authed users can read all profiles, only update own. Bootstrap admins (`danijeun@gmail.com`, `michael.bindas@njit.edu`) are flagged via `handle_bootstrap_admin` trigger.
- `memories (id, author_id→profiles, title, body jsonb, excerpt ≤280, cover_path, status: draft|published, era 1980–2100, published_at, search tsvector generated)` — GIN index on `search`. Authed users see own drafts + all published; **anon can read published** (Sprint 2 follow-up). Owner-scoped writes.
- `roster_audit (id, actor_id, action: insert|update|delete, email, before, after, at)` — written only by `log_roster_change` trigger; admin-read only.

### RPCs

- `search_memories(q, lim)` — `websearch_to_tsquery` ranked, RLS-aware. Granted to anon + authenticated.
- `get_public_profile(uuid)` / `get_public_profiles(uuid[])` — SECURITY DEFINER, exposes only safe columns (id, full_name, slug, avatar_path, class_year, role) so anon visitors can attribute memories without unlocking `profiles` RLS.
- `is_admin(uuid)` — used in roster RLS policies.

### Storage buckets

- `avatars` (private, owner-scoped writes under `{uid}/`, app fetches via signed URLs).
- `memory-covers` (public read, owner-scoped writes) — public images, served via `next/image` with `*.supabase.co` allowlisted in `next.config.ts`.
- `memory-media` (public read, owner-scoped writes) — Tiptap inline images.

## Auth flow

1. `/login` → `sendMagicLink` server action calls `supabase.auth.signInWithOtp` with redirect to `/auth/callback?from=…`.
2. `/auth/callback` verifies OTP or exchanges `code`, looks up profile, redirects: no profile → `/not-on-roster` (and `signOut`); not onboarded → `/onboarding/class`; else → `from` (sanitized to internal path).
3. `proxy.ts` reasserts the same gates on every navigation so direct URLs can't skip steps.

## Brand & theme

NJIT Highlanders palette is the source of truth in `app/globals.css`:

- `--color-brand-red: #d22630` (primary accent / focus / destructive).
- `--color-brand-navy: #071d49` (ink, accent).
- `--color-brand-gray: #c1c6c8` (rule).
- `--color-brand-white: #ffffff`.

Two layers of tokens:

- **Legacy surface aliases** (`--color-ivory`, `--color-paper`, `--color-ink`, `--color-body`, `--color-rule`, `--color-oxblood`, `--color-indigo`, `--color-moss`) — repointed to brand. Existing code uses these; don't rename.
- **Semantic intent tokens** (`--color-bg/fg/muted/border/primary/primary-fg/accent/ring`) — prefer in new components.

Dark mode (`class="dark"` on `<html>` via `next-themes`) re-skews to navy base / white fg / lightened red. Toggle in `components/nav/ThemeToggle.tsx`.

Type stack: `--font-display` (Fraunces, with `opsz` + `SOFT` axes), `--font-sans` (Inter Tight), `--font-mono` (JetBrains Mono). Fluid type ramps `text-fluid-sm` … `text-fluid-display` via `clamp()`. Body locked at 16px.

Misc: `.njit-tartan-rule` hairline (red+navy diagonal), `::selection` red on white, `*:focus-visible` 2px ring on brand red. `prefers-reduced-motion` collapses all animations + transitions globally.

## What's built

| Sprint                                   | Status                                                                                                                                                                                                                                                                                                                                                         | Notes |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| 0 — foundations                          | **Done** for tokens / breakpoints / fluid type / safe-area utilities / fonts / view transitions / dark mode / reduced motion. **Not done**: container queries beyond `MemoryCard`, `lib/responsive/` helpers, Lighthouse CI, Playwright device matrix.                                                                                                         |
| 1 — auth, onboarding, profile            | **Done.** Magic-link auth, roster gate, 4-step onboarding wizard, public profile by slug, profile edit (RHF+zod), avatar upload, admin roster CRUD, audit log w/ diff.                                                                                                                                                                                         |
| 2 — memory feed, detail, editor          | **Mostly done.** Masonry feed (CSS columns), detail page, Tiptap editor with sticky toolbar + bubble menu + link popover + character count, draft/publish via server action, FTS RPC, command palette (Cmd/Ctrl+K). **Not done**: cover-image upload UI, memory edit/delete UI, autosave pill, draft list view, search results page (RPC exists, no consumer). |
| 3 — timeline, gallery, directory, search | **Not started.** No timeline rail, gallery, alumni directory, or `/search` route. `MemoryFab`, year-scrubber, decade pin, filter Sheet vs sidebar — none built.                                                                                                                                                                                                |
| 4 — comments, reactions, realtime        | **Not started.** No tables, no Supabase Realtime channels wired.                                                                                                                                                                                                                                                                                               |
| 5 — admin (memory moderation)            | **Partial.** Roster admin only. No memory moderation queue, no flag/report path.                                                                                                                                                                                                                                                                               |
| 6 — polish                               | **Not started.** No Playwright, no Lighthouse CI, no axe, no visual-regression baselines. Only test in repo: `lib/auth/slug.test.ts` (Vitest, trivial).                                                                                                                                                                                                        |

## What's next (backlog, roughly priority-ordered)

1. **Memory editor completeness**: cover image picker (uses `memory-covers`), inline image insert UI calling `memory-media`, edit existing memory at `/memories/[id]/edit`, delete with `AlertDialog`, draft list at `/memories/drafts`, autosave (debounced server action) + visible pill.
2. **Search UI** at `/search` consuming `search_memories(q)`; wire into command palette as a query mode (currently it only navigates to fixed routes).
3. **Timeline + directory + gallery** (Sprint 3 surfaces) — year scrubber against `memories.era`, directory at `/alumni` reading `profiles` (signed-in only), gallery from cover/inline media.
4. **Comments + reactions** — new tables (`memory_comments`, `memory_reactions`), RLS, Realtime subscription on memory detail. Live-region accessibility.
5. **Bottom mobile nav + FAB safe-area pass** — `MemoryFab` exists but global bottom nav doesn't; `MobileNav` is a hamburger drawer. Decide if a true bottom tab bar replaces it on small screens.
6. **Memory moderation** for admins (flag, hide, soft-delete) + audit log parallel to roster.
7. **Container queries** for `TimelineRail` and `ProfileHeader` once those exist; today only `MemoryCard` uses `@container`.
8. **Testing & CI** — Playwright device matrix (iPhone SE / 14, Pixel 7, iPad Mini / Pro 11, Desktop 1280 / 1920, landscape phone 844x390), Lighthouse CI mobile + desktop, axe AA, `toHaveScreenshot` baselines at 375/768/1280, husky pre-push gate.
9. **Email pre-check** at `sendMagicLink` so off-roster users don't get magic links they can't use (TODO noted in `app/login/actions.ts`).
10. **Slug uniqueness on edit** is currently weak (suffixes with first 4 chars of UUID). Reuse `ensureUniqueSlug` from onboarding.

## Conventions

- Server actions live next to the page (`actions.ts`), `"use server"` at top, validate with `zod` where the input shape is non-trivial. Return `{ ok: true }` / `{ ok: false, error }` for client-rendered forms, `redirect()` for full-page flows. Use `revalidatePath` after mutations.
- Server Components are the default. Client components are minimal (`MemoryEditor`, `MemoryCard`, `RosterRow`, `EditProfileForm`, `NewMemoryClient`, nav widgets, palette). Don't move data-fetching to client unless realtime requires it.
- Don't import `motion/react` motion components directly without `LazyMotion` — the root provider uses `domAnimation` features only. Use the `m.` namespace inside.
- `cn()` from `lib/utils.ts` is the only class-merge helper. No CVA at the call site outside `components/ui/button.tsx`.
- Storage paths are `{auth.uid()}/...` to satisfy `storage.foldername(name)[1] = auth.uid()` RLS.
- Public asset URLs: covers/media via `getPublicUrl` (buckets are public). Avatars via `createSignedUrl(60*60)` (private bucket).
- Anything anon needs to read attribution-wise must go through the `get_public_profile(s)` RPC, not direct `profiles` selects, because RLS hides `profiles` from anon.
- Touch targets: 44×44 minimum on coarse pointers (`[@media(pointer:coarse)]:size-11` pattern in the editor toolbar).

## Responsiveness plan (still load-bearing)

Foundations land in Sprint 0 and every surface ships responsive in the sprint that introduces it; a polish pass closes the long tail in Sprint 6.

- **Breakpoints** in `@theme` (`xs 22.5rem`, `sm 40rem`, `md 48rem`, `lg 64rem`, `xl 80rem`, `2xl 96rem`).
- **Fluid type** via `clamp()` wired to Fraunces `opsz`. Body 16px floor.
- **Heights** use `dvh` / `svh` — never `vh`.
- **Safe area** utilities: `pt-safe`, `pb-safe`, `pl-safe`, `pr-safe`, `px-safe`, `py-safe` reading `env(safe-area-inset-*)`.
- **Container queries** reserved for `MemoryCard`, `TimelineRail`, `ProfileHeader`.
- **Reduced motion** kills ink bloom, parallax, Lenis-style smooth scroll (already enforced globally in `globals.css`).
- **Per-surface targets**:
  - S1 auth/onboarding/profile: single column `max-w-md`.
  - S2 feed/detail/editor: masonry 1/2/3/4 cols (currently CSS columns; revisit if reflow becomes a problem). Tiptap toolbar collapses to a keyboard-aware bottom bar via `visualViewport` (toolbar is sticky-top today; keyboard-aware bottom variant still TODO).
  - S3 timeline/gallery/directory/search: year scrubber horizontal `lg+`, vertical `md`, hidden under `md`. Filters in `Sheet` on mobile, sidebar `lg+`.
  - S4 comments/reactions/realtime: composer sticks above mobile keyboard, inline on desktop. Live region works at all sizes.
  - S5 admin: desktop first; mobile cards stack with full-width approve/reject.

### Performance budgets

| Class     | LCP    | CLS    | JS transfer (gz) |
| --------- | ------ | ------ | ---------------- |
| Mobile 4G | < 2.5s | < 0.1  | < 180KB          |
| Desktop   | < 1.5s | < 0.05 | < 220KB          |

### Polish-pass acceptance (Sprint 6)

Real device pass (one each: iPhone, Android, iPad, Mac). Lighthouse mobile 95+ on the five main routes. Landscape phone edge cases on editor, lightbox, timeline. Visual regression at 375 / 768 / 1280. `axe-core` AA + 44×44 touch targets every viewport. Safe-area audit on iOS notch + Android gesture bar.
