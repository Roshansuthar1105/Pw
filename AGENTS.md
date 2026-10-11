# AGENTS.md — UI rules for AI coding agents

Copy this file to the repo root. Also save it as `CLAUDE.md`, `.cursorrules` or `.github/copilot-instructions.md` so your tool picks it up.

## Before you write any UI
1. Read `design-system/DESIGN.md` and `design-system/tokens.css`.
2. Look for an existing component or page pattern first. Reuse it. Create a new one only if none fits.
3. If the request conflicts with DESIGN.md, follow DESIGN.md and say so in your reply.

## Hard rules (never break)
- **Tokens only.** Use `var(--pri)`, `var(--sf)`, `var(--bd)`, etc. (or the Tailwind aliases). No raw hex, rgb, px radii or font names in components.
- **One accent colour: blue.** Green, amber, red are for success, warning, danger only.
- **No gradients, glows, glassmorphism, emoji icons, stock illustrations or decorative animation.**
- **Cards use a 1px border, no shadow.** Shadows only on dropdowns, popovers and dialogs.
- **Icons:** inline SVG, outline, 18px, stroke 1.8 (Lucide). Never emoji.
- **Radius:** cards 12px, controls 10px, menu items 9px, dialogs 16px, badges/chips 99px.
- **Font:** Inter + Noto Sans Devanagari. Base 14px. Headings per the type scale in DESIGN.md.
- **Sidebar navigation:** max 2 levels. Groups toggle open/closed, they do not navigate. Active item uses `aria-current="page"`. The active group opens automatically.
- **Every page has:** breadcrumb, page header (h1 + one-line subtitle + at most one primary button), and empty, loading and error states.
- **Light and dark mode** must both work. Test at 360px, 768px and 1280px widths.
- **Accessibility:** AA contrast, `:focus-visible` ring, keyboard operable, correct ARIA, touch targets of at least 40px.
- **Bilingual & i18n JSON files:** no hard-coded user-facing strings and no inline translation dictionaries in services. All strings must live in separate `.json` files (`en.json`, `hi.json`) under `src/app/i18n/` (and `public/i18n/`). Allow ~30% longer Hindi text.
- **Modals for Creation & Actions:** Never render inline create/edit/action forms below tables or main page content. Use dedicated modal components located in `src/app/components/modals/` built with native `<dialog>` or the common `ModalComponent` (`<app-modal>`) + `.dialog-actions` to open modals for creation, editing, or destructive confirmations.
- **Modal Centering & Backdrop:** Every modal MUST be centered both horizontally and vertically on screen (`position: fixed; inset: 0; margin: auto;`). Modals must NEVER appear off-center or glued to the top/left of the viewport. Every modal backdrop MUST use blur and fade (`dialog::backdrop { background-color: rgba(15, 23, 42, 0.55); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); }`).
- **Common Modal Component (`<app-modal>`):** Always use or base modals on the reusable `ModalComponent` (`src/app/components/modals/modal/modal.component.ts`). It supports:
  - `size`: preset variants (`xs`, `s`/`sm`, `m`/`md`, `l`/`lg`, `xl`, `full`) or custom measurements in `px` or `%` (e.g., `'500px'`, `'60%'`).
  - `heading`: modal title rendered in the standard modal header.
  - Top-right close button ('X' icon, outline SVG, 18px stroke 1.8, touch target >= 40px) to dismiss.
  - Page/component rendering inside: either projected template (`<ng-content>`) or dynamic component outlet (`[component]="MyComponent"`).
  - Current UI design system: tokens only (`var(--sf)`, `var(--bd)`, `var(--r-dlg)`, `var(--shadow-pop)`), light/dark mode support, and keyboard accessibility (ESC to close, backdrop click).
- **Full Available Width Layout:** Main content area and routed pages (`.main`) MUST expand to fill 100% of the available viewport width (`width: 100%; min-width: 0;`). Never restrict pages with rigid max-width constraints (such as `max-width: 1180px`) that create empty margins or black voids on the right on wide displays. Content grids, cards, and tables must dynamically stretch to occupy the full available width.
- **No fake UI.** Every button, link and toggle must do something real. If the feature is not built, do not render it.
- **Permissions:** render menu items and actions only for allowed roles, and enforce the same check on the server.
- **Label data kinds:** `Actual` (green), `Estimated` (amber, with range and "Not a guarantee"), `AI-generated` (primary), `Verified` (green), `Sample` (neutral).
- **No invented content** (testimonials, results, faculty, statistics) in production code.

## Component recipes (use these class names from tokens.css)
| Need | Use |
|---|---|
| Page shell | `.app` > `.sidebar` + (`.topbar` + `.main`) |
| Menu item / group / submenu | `.menu-item`, `.menu-group.is-open`, `.submenu` |
| Card | `.card` |
| KPI | `.card.kpi` with `.label`, `.value`, `.delta` |
| Button | `.btn` (primary), `.btn--outline`, `.btn--danger`, `.btn--lg` |
| Status | `.badge`, `.badge--ok`, `.badge--warn`, `.badge--bad`, `.badge--neutral` |
| Filter | `.chip[aria-pressed]` inside `.filters` |
| Table | `.table-wrap > table`, numbers use `td.num` |
| Form | `.field` + `label` + `.input`, errors in `.field .error` |
| Dialog / Modal | `<app-modal>` (common component) or native `<dialog>` + `.dialog-actions` in `components/modals/` (centered `position: fixed; inset: 0; margin: auto;` with backdrop blur) |
| Feedback | `.toast.is-visible` (confirmations), `.alert--error` (errors) |
| Empty state | `.empty` with icon, h3, one-line text, optional action |
| Loading | `.skeleton` |
| CBT | `.cbt`, `.timer`, `.option`, `.palette` |

## Workflow for a new component or page
1. State which existing pattern you are following (DESIGN.md section number).
2. Build it with tokens and the classes above. For creation/editing or action prompts, place modals in `components/modals/`.
3. Add keys to `src/app/i18n/en.json` and `src/app/i18n/hi.json`.
4. Add empty, loading and error states.
5. Verify in light and dark mode, at 360 / 768 / 1280px, using the keyboard only.
6. Walk through the Definition of Done checklist in DESIGN.md section 11 and report anything you could not satisfy.

## Reply format
When you finish, list: files changed, patterns reused, any deviation from DESIGN.md (with the reason), and anything left undone.
