# Medhaa Design System — "Clarity"

Source of truth for every screen and component in the NEET & Board Learning Platform.
Any human or AI agent generating UI **must** follow this document, `tokens.css` and `AGENTS.md`.

**Theme in one line:** white sidebar, blue accent, neutral grey canvas, thin borders, no gradients, no decorative shadows. Calm, trustworthy, information-dense.

---

## 1. Principles

1. **Clarity over decoration.** Every element earns its place. No gradients, glows, glassmorphism, emoji-as-icons or illustrations that carry no information.
2. **One accent.** Blue (`--pri`) is the only brand colour. Green / amber / red are *semantic only* (success, warning, danger).
3. **Borders, not shadows.** Cards are separated by a 1px border. Shadows are reserved for floating layers (dropdowns, dialogs).
4. **Trust through honesty.** Actual data and estimated/predicted data are always visually labelled (see §9).
5. **Mobile-first, Android-first.** Design for a 360px viewport first. Touch targets ≥ 40px.
6. **Everything works.** No dead buttons. If a feature isn't built, it is not rendered, or it shows a proper empty state.
7. **Bilingual.** All layouts must survive Hindi (Devanagari) text, which is ~20–30% longer and needs more line height.

---

## 2. Design tokens

All values are CSS custom properties defined in `tokens.css`. **Never hard-code a colour, radius or font in a component.**

### 2.1 Colour — light mode (default)

| Token | Value | Use |
|---|---|---|
| `--pri` | `#2563eb` | Primary actions, links, active states, chart primary |
| `--pt` | `#ffffff` | Text on `--pri` |
| `--bg` | `#f6f7f9` | Page canvas |
| `--sf` | `#ffffff` | Cards, inputs, dropdowns, dialogs |
| `--sf2` | `#f1f3f6` | Subtle fill: progress track, hover, table header zones |
| `--bd` | `#e5e7eb` | All borders and dividers |
| `--tx` | `#0f172a` | Primary text |
| `--mu` | `#64748b` | Secondary text, captions, labels |
| `--sb` | `#ffffff` | Sidebar background |
| `--sbt` | `#334155` | Sidebar text |
| `--sbm` | `#94a3b8` | Sidebar muted (section labels, sub-items, chevrons) |
| `--sba` | `pri @ 10%` | Sidebar hover / active background |
| `--sbac` | `#2563eb` | Sidebar active text/icon |
| `--sbd` | `#e5e7eb` | Sidebar borders |
| `--ok` | `#16a34a` | Success, correct, "Actual" data |
| `--wn` | `#d97706` | Warning, estimated, needs attention |
| `--bad` | `#dc2626` | Error, wrong, destructive, overdue |

Derived tints use `color-mix(in srgb, var(--token) 12%, transparent)` — never separate hex values.

### 2.2 Colour — dark mode (`[data-mode=dark]`)

| Token | Value |
|---|---|
| `--pri` | `#60a5fa` |
| `--pt` | `#0b1220` |
| `--bg` | `#0d1117` |
| `--sf` | `#151b23` |
| `--sf2` | `#1b232d` |
| `--bd` | `#263040` |
| `--tx` | `#e6edf3` |
| `--mu` | `#8b98a9` |
| `--sb` | `#10161d` |
| `--sbt` | `#c9d4e0` |
| `--sbm` | `#7d8a9c` |
| `--sbac` | `#60a5fa` |
| `--sbd` | `#263040` |

Dark mode follows `prefers-color-scheme` by default and can be overridden by user setting (persisted per user). Contrast must meet WCAG AA in both modes.

### 2.3 Typography

- **Font family:** `Inter`, then `Noto Sans Devanagari` (for Hindi), then `system-ui, sans-serif`.
- **Base:** 14px / 1.5, weight 400, antialiased.
- **Headings** use the same family, `letter-spacing: -0.015em`.

| Role | Size | Weight | Notes |
|---|---|---|---|
| Page title (h1) | 26px | 700 | One per page |
| Section title (h2) | 20px | 700 | |
| Card title (h3) | 15px | 600 | `margin-bottom: 12px` |
| Body | 14px | 400 | |
| Body strong | 14px | 600 | |
| KPI value | 26px | 700 | |
| Caption / meta | 12–13px | 400–500 | colour `--mu` |
| Table header | 12px | 500 | colour `--mu` |
| Badge | 11px | 600 | |
| Sidebar section label | 11px | 600 | uppercase, `letter-spacing .08em` |
| Mobile body (CBT question text) | 16px | 400 | line-height 1.6, never smaller |

For Hindi content: line-height ≥ 1.65, never use `uppercase` or negative letter-spacing.

### 2.4 Spacing (4px base)

`4 · 8 · 10 · 12 · 14 · 16 · 18 · 24 · 32 · 48`
- Page padding: 24px desktop, 16px mobile.
- Card padding: 18px. Gap between cards: 16px.
- Form field vertical gap: 14px.

### 2.5 Radius

| Token | Value | Use |
|---|---|---|
| `--r` | `12px` | Cards, panels |
| controls | `10px` | Buttons, inputs, selects, icon buttons, dropdowns |
| menu item | `9px` | Sidebar items |
| dialog | `16px` | Dialogs, bottom sheets |
| pill | `99px` | Badges, chips, toasts |

### 2.6 Elevation

| Level | Style | Use |
|---|---|---|
| 0 | border only | Cards, tables, inputs |
| 1 | `0 12px 32px rgba(0,0,0,.14)` | Dropdowns, popovers, notification panel |
| 2 | `backdrop rgba(0,0,0,.5)` + level-1 shadow | Dialogs |

### 2.7 Motion

- Duration 150–220ms, `ease`. Only animate `transform`, `opacity`, `background-color`, `grid-template-columns`.
- Sidebar collapse 200ms. Drawer slide 220ms. Toast fade 250ms.
- Respect `prefers-reduced-motion: reduce` (disable transitions).
- No bouncing, parallax, confetti or looping animations. Exception: an indeterminate loading spinner/skeleton.

### 2.8 Iconography

- Inline SVG, **24×24 viewBox, rendered at 18px**, `fill:none; stroke:currentColor; stroke-width:1.8; stroke-linecap/linejoin:round`.
- Use one icon set (Lucide recommended — matches the stroke style). Never mix filled and outline icons. **Never use emoji as UI icons.**
- Icons inherit text colour. Icon-only buttons need `aria-label`.

---

## 3. App shell & layout

```
┌────────────┬──────────────────────────────────────────────┐
│ Sidebar    │ Topbar (sticky)                              │
│ 264px      ├──────────────────────────────────────────────┤
│ (74px rail)│ Main  (padding 24, full available width)     │
│ sticky,    │   Breadcrumb                                 │
│ full height│   Page header (title + subtitle + actions)   │
│            │   Content (cards / tables / forms)           │
└────────────┴──────────────────────────────────────────────┘
```

- Grid: `grid-template-columns: var(--sw, 264px) 1fr`. Collapsed: `--sw: 74px`.
- **Breakpoints:** `≤ 900px` = mobile/tablet drawer mode; `> 900px` = desktop sidebar. Content grids use `repeat(auto-fit, minmax(…, 1fr))` instead of fixed breakpoints where possible.
- Content expands to 100% of available viewport width (`width: 100%`). Tables and wide charts scroll inside their own `overflow-x:auto` wrapper — the page body never scrolls sideways.
- Honour safe areas: `env(safe-area-inset-*)` on sticky/fixed edges (PWA on Android/iOS).
- **Exception:** the CBT test interface and PDF viewer are *full-screen focus layouts* with no sidebar (see §7).

### 3.1 Sidebar anatomy (top → bottom)

1. **Brand:** 30px logo mark + wordmark (800 weight, 19px).
2. **Course switcher** (students only): bordered box, 12px text, shows exam/batch/medium.
3. **Menu:** items and groups, with optional uppercase section labels (`Study`, `Progress`, `Help`).
4. **User card** pinned to the bottom (`margin-top:auto`): 34px avatar, name, role/exam line, logout icon button.

### 3.2 Menu & submenu rules

- **Maximum two levels.** Never a third level.
- **Top-level item:** icon (18px) + label. Height ≈ 38px (`padding: 9px 10px`), radius 9px, gap 11px.
- **Group (has children):** same as item + chevron on the right that rotates 90° when open. Clicking toggles open/closed — it does **not** navigate.
- **Submenu:** indented 18px, `border-left: 1px solid var(--sbd)`, `padding-left: 10px`. Items have **no icon**, 13.5px, colour `--sbm`, `padding: 7px 10px`.
- **Active state:** background `--sba`, text/icon `--sbac`, weight 600. A group is "on" when any child is active, and **auto-opens** on navigation.
- **Hover:** background `--sba`.
- Items: `<button>` or `<a>`; the active one has `aria-current="page"`. Groups use `aria-expanded`.
- **Collapsed rail (74px):** icons only, centred, with `title` tooltip; labels, chevrons, submenus, section labels, course switcher and user text hidden. Clicking a group in rail mode expands the sidebar first.
- **Mobile:** sidebar is an off-canvas drawer (280px wide, slides from left, 220ms) with a dimmed overlay. Closes on navigation or overlay tap. Hamburger lives in the topbar.
- Badges in the menu (`Beta`, counts) are pill-shaped, `--pri` background.

### 3.3 Role-based menus

Menus are generated from the user's role + permissions — never hand-hidden with CSS. If a user lacks permission, the item is **not rendered** and the route returns 403 server-side.

**Student**
- Dashboard
- *Study* → Learn (My Courses · Study Material · Video Classes) · Practice (MCQ Practice · PYQ Solutions · Question Bank) · Tests (Test Series · Attempt History)
- *Progress* → Performance (Analytics · Revision Plan) · Planner (Timetable · Backlog Tracker · Mentor & Doubts)
- *Help* → AI Study Assistant (Beta) · Help & Support

**Teacher / Mentor**
- Dashboard · My Students (All Students · Progress Review · Doubts) · Content (Upload Material · Library) · Question Bank (All Questions · Bulk Import) · Tests (Create Test · Evaluate Answers)

**Admin**
- Dashboard · Users (Students · Teachers & Mentors · Roles & Access) · Courses & Batches (All Courses · Batches · Subjects & Chapters) · Content (Upload Material · Library · Publish Queue) · Tests (Test Series · Scheduling · Results)
- *Business* → Payments (Transactions · Coupons · Refunds) · Reports (Analytics · Export CSV/PDF) · Settings (Announcements · Audit Logs · Support Requests)

### 3.4 Topbar

Sticky, 10px 24px padding (10px 14px mobile), `background: --bg @ 88%` with `backdrop-filter: blur(8px)`, bottom border `--bd`. Contents left→right: sidebar toggle (36px icon button) · global search (max 380px, with results dropdown) · spacer · language switch (EN/हिन्दी) · theme toggle · notification bell with unread count dot · (admin/teacher only) nothing else. Avoid clutter.

### 3.5 Page header

Every page starts with: **breadcrumb** (13px `--mu`, `Home › Group › Page`) → **title row** (h1 + one-line subtitle on the left; primary action(s) on the right, wrapping on mobile). Maximum **one** primary (filled) button in the header; others are outline.

---

## 4. Component specifications

### 4.1 Buttons

| Variant | Style |
|---|---|
| Primary | bg `--pri`, text `--pt`, border `--pri` |
| Secondary (outline) | bg `--sf`, text `--tx`, border `--bd` |
| Danger | bg `--bad`, text white (destructive confirmations only) |
| Ghost / icon | transparent, 36×36 square icon button with `--bd` border |

- Padding `8px 16px`, radius 10px, weight 600, 14px. Large (CTA/mobile): `12px 20px`.
- Disabled: opacity .45, `cursor:not-allowed`, `disabled` attribute (not just a class).
- Loading: replace label with spinner, keep width, disable.
- One primary button per view region. Destructive actions need a confirm dialog.

### 4.2 Cards

`background: --sf; border: 1px solid --bd; border-radius: 12px; padding: 18px;` No shadow. Title (h3) optional. Clickable cards get `:hover { border-color: color-mix(in srgb, var(--pri) 40%, var(--bd)) }` and are real links/buttons.

### 4.3 KPI card

Label (13px `--mu`) → value (26px 700) → delta/helper (12px 600; `--ok` up, `--bad` down, `--mu` neutral). Grid: `repeat(auto-fit, minmax(190px, 1fr))`, 4 per row on desktop. Add the data-kind badge in the label when relevant (Actual/Estimated).

### 4.4 Badges & chips

- **Badge** (status, non-interactive): 11px/600, padding `2px 9px`, pill. Default = `pri @ 12%` bg with `--pri` text. Variants: success (`--ok`), warning (`--wn`), danger (`--bad`) — each `@ 14–16%` bg, solid text colour.
- **Chip** (filter, interactive): padding `5px 13px`, pill, border `--bd`, bg `--sf`; selected = bg `--pri`, text `--pt`. Use `aria-pressed`.

### 4.5 Tables

Header row: 12px/500 `--mu`, bottom border. Cells `11px 10px`, row separator `1px --bd`, no zebra, no outer border inside cards. Wrap in `overflow-x:auto`. Numeric columns right-aligned with tabular numbers (`font-variant-numeric: tabular-nums`). Row actions are right-aligned outline buttons. On mobile (<640px) prefer a stacked list-row layout for tables with >4 columns. Every table needs: empty state, loading skeleton, pagination (server-side, default 20/page).

### 4.6 Forms

- Label above field, 13px/600. Helper text 12px `--mu`. Error text 12px `--bad` below field, plus `aria-invalid` and `aria-describedby`.
- Input/select/textarea: padding `8px 12px` (mobile `11px 12px`), border `1px --bd`, radius 10px, bg `--sf`. Focus: `outline: 2px solid var(--pri); outline-offset: 1px`.
- Validate inline on blur and again on submit; never clear the form on error. Indian mobile numbers: `^[6-9]\d{9}$`.
- Checkbox/radio: `accent-color: var(--pri)`, 17px, whole label row clickable.
- Required fields marked with text "(required)", not just a red asterisk.
- File upload: dashed `--bd` drop zone, shows type/size limits, progress bar, and per-file error.

### 4.7 Progress, charts

- Progress bar: 7px high, track `--sf2`, fill `--pri`, radius 99. Use `--wn` fill when below target/threshold, `--ok` when complete only if semantically meaningful.
- Charts: series 1 = `--pri`; additional series use tints of `--pri` and then neutral greys. Max **4** colours per chart. Axis/labels 11–12px `--mu`, gridlines `--bd`. Always include a text alternative (summary line or data table) for accessibility.
- Bar charts start at zero. Line charts mark points with 4px dots.

### 4.8 Dialogs, drawers, toasts, dropdowns

- **Dialog:** native `<dialog>`, max-width 460px (640px for forms), 92% width on mobile, radius 16px, padding 24px, backdrop `rgba(0,0,0,.5)`. Title 18px/600. Footer actions right-aligned: secondary left of primary. On mobile, prefer bottom sheets. `Esc` closes. Focus is trapped and returned on close.
- **Toast:** bottom-centre, pill, `--tx` bg with `--bg` text, 13px, auto-dismiss 2–4s, `role="status"`. Only for confirmations of *real* completed actions. Errors that need action use inline alerts, not toasts.
- **Dropdown/popover:** `--sf`, 1px `--bd`, radius 12px, shadow level 1, padding 6px, items 9px radius with `--sf2` hover. Closes on outside click and `Esc`.

### 4.9 Empty, loading, error states (mandatory for every list/table/page)

- **Empty:** centred, 40px `--pri` icon, h3 title ("No material found"), one-line explanation, and a relevant action if the user can fix it. Never a blank area.
- **Loading:** skeleton blocks in `--sf2` with a subtle opacity pulse (respect reduced motion). No full-page spinners except initial app load.
- **Error:** inline alert (`--bad` tint bg, 1px border, icon, message, **Retry** button). Message says what happened and what to do, never raw error codes.

### 4.10 Breadcrumbs, tabs, pagination

- Breadcrumb: 13px `--mu`, separator `›`, last item `--tx`.
- Tabs: underline style, 2px `--pri` bottom border on active, labels 14px/600; horizontally scrollable on mobile.
- Pagination: Prev/Next outline buttons + "Page X of Y"; page-size select optional.

---

## 5. Page patterns

| Page | Pattern |
|---|---|
| Dashboard | 4 KPI cards → 2-column grid of cards (targets, upcoming, continue learning, activity) |
| Library / lists | Filter row (search + chips/selects) → card containing a table/list → pagination |
| Detail | Breadcrumb → header with actions → two-column (content + side metadata) |
| Forms / upload | Single column, max-width 720px, sticky action bar on mobile |
| Analytics | KPI row → chart cards → breakdown tables → recommendations |
| Settings | Left sub-tabs or sectioned cards with a save bar |

### 5.1 Study material & PDF viewer
In-browser PDF viewer opens as a full-screen layout: slim top bar (back, title, page X/Y, zoom, bookmark, download-if-permitted), content centred on `--sf2`. Download button is shown **only** when the content's download permission allows it. Files are served via short-lived signed URLs.

### 5.2 CBT test interface (focus layout)
- No sidebar. Top bar: test name · section tabs · **timer** (pill, `--pri`; turns `--wn` at 10 min, `--bad` at 1 min; announce via `aria-live="polite"` at thresholds only).
- Desktop: question area (flex) + 280px palette. Mobile: question area full width, palette in a bottom sheet toggle.
- Palette buttons 40×40: not visited (bordered), answered (`--ok` fill), marked for review (violet `#8b5cf6` fill), current (2px `--pri` outline), answered+marked (violet with green dot). Include a legend.
- Question text 16px/1.6, options as full-width 48px+ buttons with A/B/C/D markers; selected = `--pri` border + 8% tint.
- Actions: Prev · Mark for review · Clear · **Save & Next** (primary). Submit lives in the palette panel and always opens a summary confirm (answered / review / unattempted).
- Show "Autosaved hh:mm:ss" and a visible offline/reconnecting banner. Submit is idempotent (disable after first click).

### 5.3 Analytics & results
- Distinguish data kinds with badges: **Actual** (green) = computed from submitted answers/cohort; **Estimated** (amber) = predictions (AIR, percentile outside a valid cohort). Estimates always show a range and the note "Not a guarantee".
- Percentile/rank only displayed when cohort size ≥ the configured minimum; otherwise show "Not enough data yet".
- Weak topics use `--wn`; strong topics `--ok`. Never rely on colour alone — pair with text/icons.

### 5.4 AI assistant
Chat layout inside the shell. Every AI reply carries an "AI-generated" badge, source chips linking to the study material used, and a "Report an error" action. Hints before full solutions. Never styled as authoritative/verified unless a teacher has approved the content.

---

## 6. Content, language & tone

- Plain, respectful, encouraging; no hype ("Boost your rank 10x!"). No fake urgency timers.
- Sentence case for everything except the app/brand names. Buttons are verbs: "Start test", "Save plan".
- Indian formats: `₹14,999` (`toLocaleString('en-IN')`), `DD MMM YYYY`, 12-hour time with AM/PM, IST.
- **i18n:** all strings live in translation files (`en`, `hi`). No concatenated sentences; use ICU placeholders. Medium (Hindi/English) of *content* is independent of UI language.
- Never invent testimonials, results, faculty or statistics in production. Sample data must be labelled as sample in demos.

---

## 7. Accessibility (WCAG 2.2 AA)

- Text contrast ≥ 4.5:1 (3:1 for ≥ 18px/bold); verify `--mu` on `--bg` and `--sbm` on `--sb` in both modes.
- Visible focus ring on every interactive element: `outline: 2px solid var(--pri); outline-offset: 2px` (use `:focus-visible`).
- Full keyboard operation: menu groups with `Enter/Space`, `Esc` closes overlays, logical tab order, skip-to-content link.
- Semantic HTML: `<nav aria-label="Main">`, `<main>`, one `<h1>`, buttons vs links used correctly.
- Targets ≥ 40×40 CSS px on touch. Don't rely on colour alone. `lang` attribute set to `hi` for Hindi content.
- Respect `prefers-reduced-motion` and `prefers-color-scheme`.

---

## 8. Performance & PWA

- Ship the font with `font-display: swap`, subset to Latin + Devanagari. Prefer system-font fallback during load.
- Target LCP < 2.5s on mid-range Android over 4G. Lazy-load charts, PDF viewer and non-critical routes. Paginate; virtualise lists > 200 rows.
- PWA: manifest (`display: standalone`, `theme_color #2563eb`, `background_color #f6f7f9`), maskable icons, offline fallback page, and cached shell. Never cache authenticated API responses or signed URLs.

---

## 9. Data-trust labelling (platform-wide rule)

| Kind | Badge | Colour | Example |
|---|---|---|---|
| Actual | `Actual` | success | Score, accuracy, batch rank (valid cohort) |
| Estimated | `Estimated` | warning | All-India rank range, predicted score |
| AI-generated | `AI-generated` | primary | Explanations, summaries, practice questions |
| Teacher-verified | `Verified` | success | Solutions reviewed by faculty |
| Sample | `Sample` | neutral | Demo/seed content |

---

## 10. Do / Don't

| Do | Don't |
|---|---|
| Use tokens (`var(--pri)`) | Hard-code hex colours or px radii |
| Border-only cards | Add `box-shadow` to cards |
| One filled button per area | Multiple competing primary buttons |
| 18px outline SVG icons | Emoji or mixed icon styles |
| Show empty/loading/error states | Leave blank space or infinite spinners |
| Keep menus to 2 levels | Add a third menu level or mega menus |
| Label Actual vs Estimated | Present predictions as facts |
| Use real, working actions | Render buttons that do nothing |
| Left-align text and data | Centre-align body copy or tables |
| Use blue only for interaction/brand | Use blue for decoration or semantic status |
| Keep copy factual and calm | Use urgency, hype or dark patterns |

---

## 11. Definition of done for any new component or page

- [ ] Uses only tokens from `tokens.css`; no raw colours/radii/fonts.
- [ ] Correct in **light and dark** mode and 3 widths: 360, 768, 1280.
- [ ] Has empty, loading and error states.
- [ ] Keyboard operable, visible focus, correct ARIA, AA contrast.
- [ ] Strings externalised (EN + HI), tested with long Hindi text.
- [ ] Touch targets ≥ 40px; no horizontal page scroll.
- [ ] Permission-aware (rendered only for allowed roles; server enforces).
- [ ] Data kinds labelled (Actual / Estimated / AI-generated).
- [ ] Every button/action is wired to real behaviour.
- [ ] Matches existing patterns (§3–§5) before inventing new ones.
