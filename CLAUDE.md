@AGENTS.md

## Responsiveness

Responsive support is split across three sprints, not crammed into one. Foundations land early so every surface is built responsive from day one, with a dedicated polish pass at the end.

### Sprint 0 — foundations (best home for the groundwork)

Land before any UI surface ships.

- Breakpoints in Tailwind v4 `@theme`: `xs 360`, `sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536`.
- Fluid display type via `clamp()` wired to Fraunces `opsz`. Body locked at 16px minimum.
- `dvh` and `svh` everywhere a full height surface appears. Never `vh`.
- `env(safe-area-inset-*)` utilities for bottom nav, FAB, sticky headers.
- Container query layer (`@container`) reserved for `MemoryCard`, `TimelineRail`, `ProfileHeader`.
- `prefers-reduced-motion` kills ink bloom, parallax, Lenis smooth scroll.
- Playwright device matrix: iPhone SE, iPhone 14, Pixel 7, iPad Mini, iPad Pro 11, Desktop 1280, Desktop 1920. Plus landscape phone 844x390.
- Lighthouse CI mobile and desktop profiles against preview deploys, budgets enforced.

### Sprints 1 to 5 — responsive on day one

Every surface ships responsive in the same sprint that introduces it. Definition of done includes the full device matrix passing.

| Sprint | Surface                              | Key responsive behavior                                                                                       |
| ------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| 1      | Auth, onboarding, profile            | Single column max-w-md, trivially fluid                                                                       |
| 2      | Memory feed, detail, editor          | Masonry 1/2/3/4 cols, Tiptap toolbar collapses to keyboard aware bottom bar via `visualViewport`              |
| 3      | Timeline, gallery, directory, search | Year scrubber horizontal `lg+`, vertical `md`, hidden under `md`. Filters in `Sheet` on mobile, sidebar `lg+` |
| 4      | Comments, reactions, realtime        | Composer sticks above mobile keyboard, inline on desktop. Live region works at all sizes                      |
| 5      | Admin queue                          | Desktop first, mobile cards stacked with full width approve and reject                                        |

### Sprint 6 — polish pass

Last sprint absorbs the long tail.

- Real device pass: one iPhone, one Android, one iPad, one Mac.
- Lighthouse mobile 95+ on the five main routes.
- Landscape phone edge cases on editor, lightbox, timeline.
- Visual regression baselines via Playwright `toHaveScreenshot` at 375 / 768 / 1280.
- `axe-core` AA contrast and 44x44 touch targets on every viewport.
- Safe area audit on iOS notch and Android gesture bar.

### Performance budgets

| Class     | LCP    | CLS    | JS transfer (gz) |
| --------- | ------ | ------ | ---------------- |
| Mobile 4G | < 2.5s | < 0.1  | < 180KB          |
| Desktop   | < 1.5s | < 0.05 | < 220KB          |

### Agent split for the foundations work

Spawn in this order. Foundations blocks everyone, then the rest fan out.

1. `foundations` — tokens, breakpoints, container queries, fluid type, safe area utility. Touches `globals.css`, theme, `lib/responsive/`.
2. `navigation` — bottom nav, top nav, hamburger sheet, FAB. Touches `components/nav/`, root `layout.tsx`.
3. `feed-and-gallery` — masonry, `MemoryCard` container queries, lightbox, infinite scroll.
4. `editor` — Tiptap responsive toolbar, mobile keyboard handling, autosave pill placement.
5. `timeline-and-directory` — year scrubber, decade pin, directory filter sheet vs sidebar.
6. `admin` — queue and Tremor chart responsive layouts.
7. `testing` — Playwright device matrix, Lighthouse CI config, axe checks, visual regression baselines.
