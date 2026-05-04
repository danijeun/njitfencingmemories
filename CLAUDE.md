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
- **Email**: `resend` for transactional mail (access-request approve/decline notifications via `lib/email/send.ts`).
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
      page.tsx               social feed: 3 pinned + paginated (infinite scroll), filters by role/era/sort, FAB if authed
      new/                   server action + Tiptap client editor
      drafts/                user-scoped draft list
      [id]/page.tsx          memory detail (public read)
      [id]/edit/             owner-scoped edit form
    highlanders/             directory of athletes / alumni / coaches (renamed from /alumni); filters: role, year, q, sort
    gallery/                 grid of cover + inline media
    search/                  FTS results (consumes search_memories RPC)
    profile/
      me/page.tsx            redirects to /profile/<slug>
      [handle]/page.tsx      public profile (signed-in viewers)
      edit/                  RHF + zod, avatar upload
    admin/
      roster/                admin-only CRUD + AlertDialog delete
      audit/                 last 200 roster_audit rows w/ diff
      requests/              triage tabs (pending / approved / declined) for off-roster access requests
  login/                     magic link request + status (with link to /request-access)
  request-access/            public form for off-roster users (full name + email), no auth needed
  auth/callback/route.ts     OTP verify + code exchange, profile gate
  onboarding/                4-step wizard: class → identity → avatar → bio
  not-on-roster/             dead-end for non-roster sign-ins (offers /request-access)
```

`proxy.ts` enforces: public paths (`/`, `/login`, `/auth/callback`, `/not-on-roster`, `/request-access`, `/memories`, `/memories/[id]`, `/highlanders`, `/gallery`, `/search`) — everything else needs auth. `/memories/new` is a gated exception. After auth, missing profile → `/not-on-roster` (and signs out); missing `onboarded_at` → `/onboarding/class`; onboarded users hitting `/login` or `/onboarding/*` → `/profile/me`.

## Data model (Supabase, all migrations applied in `supabase/migrations/`)

- `member_role` enum: `athlete | alumni | coach`.
- `roster (email PK, role, class_year, full_name, invited_at, claimed_at)` — RLS denies anon/authenticated; admins (via `is_admin(uid)` SECURITY DEFINER helper) can CRUD. Service role bypasses.
- `profiles (id PK = auth.users.id, email FK→roster.email, role, class_year, full_name, major, avatar_path, bio, slug UNIQUE, onboarded_at, is_admin, created_at, updated_at)` — created on first sign-in by `handle_new_user()` trigger if email is on roster; else trigger no-ops and middleware bounces them. Authed users can read all profiles, only update own. Bootstrap admins (`danijeun@gmail.com`, `michael.bindas@njit.edu`) are flagged via `handle_bootstrap_admin` trigger.
- `memories (id, author_id→profiles, title, body jsonb, excerpt ≤280, cover_path, status: draft|published, era 1980–2100, published_at, pinned_at, pinned_by→profiles, search tsvector generated)` — GIN index on `search`, partial index on `(pinned_at desc, id desc)` for pinned items. Authed users see own drafts + all published; **anon can read published**. Owner-scoped writes; admin-only update for pin columns enforced by RLS + `guard_memory_pin_columns` trigger (non-admins reverting pin column writes).
- `roster_audit (id, actor_id, action: insert|update|delete, email, before, after, at)` — written only by `log_roster_change` trigger; admin-read only.
- `access_requests (id, full_name, email, status: pending|approved|declined, decided_by, decided_at, created_at)` — public insert (anon-callable from `/request-access`), admin read + update. Approving via `approve_access_request` RPC inserts into `roster` (firing the audit trigger).
- `memory_comments (id, memory_id→memories cascade, author_id→profiles cascade, body 1–2000, hidden_at, hidden_by→profiles, created_at, updated_at)` — anon + authenticated read of visible (non-hidden) comments on published memories; authors and admins always see their own/all. Owner-or-admin update/delete; non-admins are blocked from flipping `hidden_at`/`hidden_by` by `guard_comment_hidden_columns` trigger (mirrors the pin guard).
- `memory_reactions (id, memory_id→memories cascade, author_id→profiles cascade, emoji ∈ {❤️🎉🔥💪🦅}, created_at, unique(memory_id, author_id, emoji))` — anon + authenticated read on published memories; owner-only insert/delete (toggle = delete + insert, no update policy).
- Both comment + reaction tables are members of the `supabase_realtime` publication so the `memory:{id}` channel can subscribe to `postgres_changes`.

### RPCs

- `search_memories(q, lim)` — `websearch_to_tsquery` ranked, RLS-aware. Granted to anon + authenticated.
- `feed_memories(p_roles[], p_eras[], p_sort, p_limit, p_offset, p_exclude_ids[])` — paginated published feed honoring filters; `p_exclude_ids` skips the pinned IDs already rendered above the fold.
- `pinned_memories(p_roles[], p_eras[], p_limit default 3)` — SECURITY DEFINER, returns pinned published memories (max 3) honoring same filters, ordered by `pinned_at desc`.
- `get_public_profile(uuid)` / `get_public_profiles(uuid[])` — SECURITY DEFINER, exposes only safe columns (id, full_name, slug, avatar_path, class_year, role) so anon visitors can attribute memories without unlocking `profiles` RLS.
- `is_admin(uuid)` — used in roster + memory pin RLS policies.
- `is_email_on_roster(p_email text)` — anon-callable boolean check used by `/login` to decide whether to send a magic link (avoids leaking roster membership but also avoids dispatching unusable links).
- `approve_access_request(p_id uuid, p_role member_role, p_class_year int)` — admin-only, inserts roster row + flips request to `approved`.
- `get_memory_thread(p_memory_id uuid)` — SECURITY DEFINER, anon-callable, returns visible (non-hidden) comments on a published memory joined to safe profile fields for attribution. Mirrors `pinned_memories` shape.

Realtime channel naming convention is `memory:{id}` — reuse this prefix for future per-memory live features (presence, live pin/unpin).

### Storage buckets

- `avatars` (**public read**, owner-scoped writes under `{uid}/`). Anon reads via `getPublicUrl`. `signedAvatarUrls` in `lib/storage/` still exists and is used in admin/editor contexts where short-lived signed URLs are preferred.
- `memory-covers` (public read, owner-scoped writes) — served via `next/image` with `*.supabase.co` and the local `127.0.0.1:54321` dev origin allowlisted in `next.config.ts`.
- `memory-media` (public read, owner-scoped writes) — Tiptap inline images.

## Auth flow

1. `/login` → `sendMagicLink` server action first calls `is_email_on_roster(email)` RPC. If false, it returns the same `?sent=1` UI without dispatching mail (no roster-membership leak); if true, it calls `supabase.auth.signInWithOtp` with redirect to `/auth/callback?from=…`.
2. `/auth/callback` verifies OTP or exchanges `code`, looks up profile, redirects: no profile → `/not-on-roster` (and `signOut`); not onboarded → `/onboarding/class`; else → `from` (sanitized to internal path).
3. `proxy.ts` reasserts the same gates on every navigation so direct URLs can't skip steps.
4. Off-roster users land on `/not-on-roster`, which links to `/request-access`. Submitting that form inserts into `access_requests` (anon-allowed). Admins triage at `/admin/requests`; approval calls `approve_access_request` RPC and (via Resend) emails the requester.

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

| Sprint                            | Status                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Notes |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| 0 — foundations                   | **Done** for tokens / breakpoints / fluid type / safe-area utilities / fonts / view transitions / dark mode / reduced motion. **Not done**: container queries beyond `MemoryCard`, `lib/responsive/` helpers, Lighthouse CI, Playwright device matrix.                                                                                                                                                                                                                                                                                                               |
| 1 — auth, onboarding, profile     | **Done.** Magic-link auth, roster gate, 4-step onboarding wizard, public profile by slug, profile edit (RHF+zod), avatar upload, admin roster CRUD, audit log w/ diff.                                                                                                                                                                                                                                                                                                                                                                                               |
| 2 — memory feed, detail, editor   | **Done.** Social feed (3 pinned + paginated infinite scroll, filters by role/era/sort) replaced the masonry. Detail page, Tiptap editor (sticky toolbar + bubble menu + link popover + character count + cover-image picker + inline-image insert via `memory-media`), draft/publish server actions, owner-scoped edit/delete, draft list at `/memories/drafts`, FTS RPC + `/search` results page, command palette (Cmd/Ctrl+K). **Still not done**: autosave pill, palette query mode (palette only navigates to fixed routes today).                               |
| 3 — gallery, directory, search    | **Mostly done.** `/highlanders` directory (renamed from `/alumni`) with role/year/q filters and sort modes; `/gallery` from cover/inline media; `/search` consuming `search_memories`. Loading skeletons + NavProgress bar shipped. **Not done**: timeline rail with year scrubber, decade pin.                                                                                                                                                                                                                                                                      |
| 4 — comments, reactions, realtime | **Done.** `memory_comments` + `memory_reactions` tables (RLS, hidden-column trigger guard), `get_memory_thread` RPC, server actions in `app/(app)/memories/[id]/actions.ts`, single `<MemoryThread/>` client island on `/memories/[id]` with optimistic updates, sr-only live region, owner/admin moderation menu, and a Supabase Realtime channel (`memory:{id}`) handling postgres_changes for both tables. Composer is keyboard-aware via `visualViewport`. **Still not done:** comment editing, threaded replies, mentions/notifications/email digest, presence. |
| 5 — admin                         | **Mostly done.** Roster CRUD + audit log, access-request triage at `/admin/requests` with Resend email notifications, admin-only memory pinning (max 3, RLS + trigger guarded). **Not done**: memory moderation queue, flag/report path, soft-delete, parallel memory audit log.                                                                                                                                                                                                                                                                                     |
| 6 — polish                        | **Not started.** No Playwright, no Lighthouse CI, no axe, no visual-regression baselines. Only test in repo: `lib/auth/slug.test.ts` (Vitest, trivial).                                                                                                                                                                                                                                                                                                                                                                                                              |

## What's next (backlog, roughly priority-ordered)

1. **Autosave** for the memory editor (debounced server action) + visible pill; palette query mode that runs `search_memories` instead of just navigating to fixed routes.
2. **Timeline rail** — year scrubber against `memories.era`, decade pins, horizontal `lg+` / vertical `md` / hidden under `md`.
3. **Bottom mobile nav + FAB safe-area pass** — `MemoryFab` exists but a global bottom tab bar doesn't; `MobileNav` is a hamburger drawer. Decide if a true bottom tab bar replaces it on small screens.
4. **Memory moderation** for admins (flag, hide, soft-delete) + memory_audit log parallel to roster_audit. Pinning + comment hide are in place but flag/report on memories is not.
5. **Comments v2** — editing, threaded replies, mentions/notifications/email digest, presence ("3 alumni reading now") on the existing `memory:{id}` channel.
6. **Container queries** for `TimelineRail` and `ProfileHeader` once those exist; today only `MemoryCard` uses `@container`.
7. **Testing & CI** — Playwright device matrix (iPhone SE / 14, Pixel 7, iPad Mini / Pro 11, Desktop 1280 / 1920, landscape phone 844x390), Lighthouse CI mobile + desktop, axe AA, `toHaveScreenshot` baselines at 375/768/1280, husky pre-push gate. Today only `lib/auth/slug.test.ts` exists.
8. **Slug uniqueness on edit** is currently weak (suffixes with first 4 chars of UUID). Reuse `ensureUniqueSlug` from onboarding.

## Conventions

- Server actions live next to the page (`actions.ts`), `"use server"` at top, validate with `zod` where the input shape is non-trivial. Return `{ ok: true }` / `{ ok: false, error }` for client-rendered forms, `redirect()` for full-page flows. Use `revalidatePath` after mutations.
- Server Components are the default. Client components are minimal (`MemoryEditor`, `MemoryCard`, `RosterRow`, `EditProfileForm`, `NewMemoryClient`, nav widgets, palette). Don't move data-fetching to client unless realtime requires it.
- Don't import `motion/react` motion components directly without `LazyMotion` — the root provider uses `domAnimation` features only. Use the `m.` namespace inside.
- `cn()` from `lib/utils.ts` is the only class-merge helper. No CVA at the call site outside `components/ui/button.tsx`.
- Storage paths are `{auth.uid()}/...` to satisfy `storage.foldername(name)[1] = auth.uid()` RLS.
- Public asset URLs: covers/media/avatars via `getPublicUrl` (all three buckets are public-read). `signedAvatarUrls` helper still exists in `lib/storage/` for the admin/editor surfaces that prefer short-lived signed URLs.
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
  - S2 feed/detail/editor: single-column social feed with infinite scroll; pinned section above the fold. Tiptap toolbar collapses to a keyboard-aware bottom bar via `visualViewport` (toolbar is sticky-top today; keyboard-aware bottom variant still TODO).
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
