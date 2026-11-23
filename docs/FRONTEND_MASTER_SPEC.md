# CreditLens — Frontend Master Spec

Status: FINAL for the UI. Version 1.1, 2026-11-23 (v1.1: visual design switched to the CreditLens prototype).
Audience: a coding agent that will build the frontend. Read this whole file before writing code.
Authority, in this order:
1. **Look and feel** (colour, type, spacing, shapes, logo, layout proportions): the prototype file `docs/ui/creditlens_credit_risk_research_demo.html` is the source of truth. Open it in a browser and match it. Section 4 is extracted from it.
2. **Behaviour, copy, honesty rules, API, states, accessibility, tests**: this spec wins over the prototype. The prototype is a static one-file mock; section 14 lists where the real app must go beyond it.
3. Earlier chats, screenshots and the old blue/amber "Civic Ledger" design are **obsolete**. Ignore them.

---

## 0. What you are building

A small, honest, five-screen web app called **CreditLens** for a **research / portfolio project**: a credit-risk model that predicts loan default and tests how well it works for **thin-file** applicants (people with little or no credit-bureau history), with SHAP explanations.

It is **not** a lending tool, **not** a bank dashboard, and has **no login**. The model is not trained yet and the backend does not exist yet, so you build against a **fixed API contract (section 9) with a mock layer (section 10)**. The real backend plugs in later with no UI changes.

Screens:

| # | Route | Screen | Purpose |
|---|---|---|---|
| 1 | `/` | Home | Explain the project, link to the demo, state limits |
| 2 | `/score` | Score an applicant | Form: one applicant |
| 3 | `/score/result` | Result | Risk estimate + SHAP factor bars |
| 4 | `/batch` | Batch scoring | Upload CSV, set cutoffs, histogram, ranked list |
| 5 | `/report` | Model report | Metrics by group, calibration, fairness, limits |

## 1. Hard rules (non-negotiable)

These exist because the project's credibility depends on never faking anything. A build that breaks one of these is rejected.

1. **Every page** shows the dark top banner: `Research demo. Not a lending decision. Nothing here is a real score or a real applicant.`
2. **Never invent numbers.** Every number on screen comes from the API (or the mock layer). If a value is missing, show `—`. Never show a default, a zero, or a made-up range in its place.
3. **Mock data is labelled.** Whenever a response has `is_sample: true`, show the blue `Sample output` banner on that screen (copy in section 7). Mock mode must set `is_sample: true` on everything.
4. **No approve / decline buttons.** The words Approve / Review / Reject appear only as **band labels** on a risk range, never as actions.
5. **No login, accounts, cookies banners, analytics, trackers, third-party scripts.** Fonts are self-hosted (`@fontsource/inter`, `@fontsource/plus-jakarta-sans`), not loaded from Google. Tailwind is built, not loaded from a CDN.
6. **No compliance badges** (no SOC2, GDPR, "bank-grade", "secure", lock icons), no company or customer names, no logos other than the CreditLens mark in section 4.4, no stock photos, no avatars, no testimonials. "CreditLens" is the project's own name, chosen by the owner (see 11 for a naming caveat); it must come from one constant, `PRODUCT_NAME`.
7. **No real applicant data in the repo.** No dataset files, no model files, no screenshots of real rows. Mock rows are synthetic and generated from the formula in section 10.
8. **Gender and age are never inputs.** They must not appear in the Score form. (They appear only as evaluation groups on the Report.)
9. **Do not reword the honesty copy** (banners, "What this is not", "Limits you should know about", notes). Copy is in section 7 and is final. Put all copy in `src/content/` so it is editable in one place.
10. **Do not silently fill the placeholders** in section 11. They are unknown on purpose. Use the placeholder constants and keep the release check (section 12.4) passing only when they are real.

## 2. Tech stack (decided; do not re-litigate)

- Vite + React 18 + TypeScript (`strict: true`)
- React Router 6
- Tailwind CSS 3, design tokens in `tailwind.config.ts` (section 4)
- `zod` to validate every API response (a contract mismatch must fail loudly in dev)
- `@fontsource/inter` (weights 400, 500, 600, 700) and `@fontsource/plus-jakarta-sans` (weights 600, 700, 800)
- **No chart library.** The two charts (histogram, calibration) and the factor bars are small hand-built SVG/CSS (sections 6.4 and 6.5). Zero chart dependencies.
- Tests: Vitest + React Testing Library; Playwright for smoke + `@axe-core/playwright`
- Package manager: npm. Node 20.

Repo location: `frontend/` at the repo root.

```
frontend/
  src/
    config/        project.ts (placeholders, constants)  api.ts (base URL, mock flag)
    content/       copy.ts   (ALL user-facing text from section 7)
    api/           client.ts  schemas.ts (zod)  mock.ts  types.ts
    lib/           bands.ts  histogram.ts  reconcile.ts  csv.ts  format.ts
    components/    TopBanner, Header, Footer, Card, Banner, Button, Field,
                   RiskBar, FactorBars, Histogram, CalibrationChart,
                   DataTable, BandPill, FileChip, KpiTile
    pages/         Home, Score, Result, Batch, Report, NotFound
    App.tsx  main.tsx  index.css
  tests/           unit + e2e
  scripts/         check-placeholders.mjs
```

## 3. Page shell (all five screens)

Order, top to bottom:

1. **Top banner** — full width, `bg-slate-900 text-white`, `text-xs sm:text-[13px] leading-snug text-center px-4 py-2.5`, `role="note"`. Copy: rule 1. Not sticky.
2. **Header** — `sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80`. Inner container `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8`, row `h-16 flex items-center justify-between`.
   - Left: brand link to `/`: the logo tile and wordmark from 4.4, gap 12.
   - Right (md and up): `<nav aria-label="Primary Navigation" class="hidden md:flex items-center h-full space-x-1">` with 4 **links** (real `<a href>` via the router, never buttons): `Home`, `Score an applicant`, `Batch scoring`, `Model report`. Each: `h-full px-4 inline-flex items-center text-sm`, bottom border 2px. Inactive: `font-medium text-slate-600 hover:text-slate-900 border-transparent`. Active: `font-semibold text-teal-700 border-teal-600` plus `aria-current="page"`.
   - Active rules: `/` → Home; `/score` and `/score/result` → Score an applicant; `/batch` → Batch scoring; `/report` → Model report.
   - Below `md`: a hamburger button (`p-2 rounded-lg text-slate-600 hover:bg-slate-100`, `aria-label="Toggle menu"`, `aria-expanded`, `aria-controls`) toggling a dropdown under the header (`bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-1`). Items are links: `block w-full text-left px-3 py-2.5 rounded-lg text-sm`; active = `font-semibold bg-teal-50 text-teal-700` + `aria-current`; inactive = `font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900`. Selecting an item closes the menu.
3. **Main** — `flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10`. Vertical gap between blocks: `space-y-6` (Home: `space-y-10`).
4. **Footer** — `bg-white border-t border-slate-200/90 mt-12`; inner `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 text-xs text-slate-500 leading-relaxed`. Copy: section 7.1 (includes the repo link placeholder).

Page background `bg` #F8FAFC, body text `ink`, `-webkit-font-smoothing: antialiased`, global `font-variant-numeric: tabular-nums` for numbers. Body font Inter; display font Plus Jakarta Sans (4.2).

Set `document.title` per page: `CreditLens — Home`, `CreditLens — Score an applicant`, `CreditLens — Result`, `CreditLens — Batch scoring`, `CreditLens — Model report`. Move focus to the page `<h1>` on route change (`tabIndex={-1}`, `preventScroll`), and scroll to top. Content panels fade in with `fadeSlideIn` (opacity 0→1, translateY 4px→0, 0.22s ease-out), disabled under `prefers-reduced-motion`.

## 4. Design tokens

Extracted from `docs/ui/creditlens_credit_risk_research_demo.html`. Put them in `tailwind.config.ts` (Tailwind v3 names shown; hex for reference). Use semantic token names in components.

### 4.1 Colours

| Token | Tailwind / hex | Use |
|---|---|---|
| `bg` | #F8FAFC | Page background |
| `surface` | #FFFFFF | Cards, header (90% + blur), footer |
| `border` | slate-200 #E2E8F0 (cards at 90%, header at 80%, table dividers slate-100 #F1F5F9) | Card and table borders |
| `ink` | slate-900 #0F172A | Headings, key numbers, top banner bg, risk marker |
| `body` | slate-700 #334155 | Lists, labels |
| `muted` | slate-600 #475569 | Descriptions, inactive nav |
| `subtle` | slate-500 #64748B | Helper text, axis labels, `—` cells, placeholders |
| `primary` | teal-600 #0D9488 | Primary button bg, Approve fills, "lowers risk" bars, approve slider thumb, focus outline |
| `primary-hover` | teal-700 #0F766E | Primary button hover |
| `primary-text` | teal-700 #0F766E (hover teal-800 #115E59) | Links, active nav, Approve value labels |
| `primary-tint` / `-border` | teal-50 #F0FDFA / teal-200 #99F6E4 | Eyebrow pill, Approve KPI tile, approve pill, mobile active item |
| `amber` | amber-600 #D97706 | **Fills, dots, outlines only**: "raises risk" bars, Review outline |
| `amber-bar` | amber-300 #FCD34D | Review bars, Review stacked segment, Moderate risk segment |
| `amber-text` | amber-700 #B45309 | Amber used as text on white |
| `amber-ink` | amber-800 #92400E | Text on amber tints |
| `warn-bg` / `warn-border` | amber-50 #FFFBEB (75–85%) / amber-200 #FDE68A | "What this is not", thin-file card, Report status banner, limits, Review KPI tile |
| `reject` | rose-600 #E11D48 | Reject fills, reject slider thumb |
| `reject-text` | rose-700 #BE123C (value label), rose-800 #9F1239 (pills, KPI label) | |
| `reject-tint` / `-border` | rose-50 #FFF1F2 / rose-200 #FECDD3 | Reject pill and KPI tile |
| `info-bg` / `info-border` / `info-dot` | sky-50 #F0F9FF (90%) / sky-200 #BAE6FD / sky-500 #0EA5E9 | `Sample output` banner, "Provisional fields" note |
| `riskbar-lower / moderate / higher` | teal-400 #2DD4BF (80%) / amber-300 #FCD34D / rose-400 #FB7185 (85%) | Result risk bar |
| `thead` | slate-50 #F8FAFC (90%) | Table header bg |
| `input-border` | slate-300 #CBD5E1 | Inputs, selects, dashed upload box (see 12.1 gap A2) |
| `error` | #B91C1C | Form validation only (added in this spec) |
| `logo-from / via / to` | teal-500 #14B8A6 / teal-600 #0D9488 / indigo-800 #3730A3 | Logo tile gradient (`bg-gradient-to-br`) |

Band pills (all `rounded-full px-2.5 py-0.5 text-xs font-semibold border`): Approve `bg-teal-50 text-teal-800 border-teal-200`; Review `bg-amber-100/90 text-amber-800 border-amber-200`; Reject `bg-rose-50 text-rose-800 border-rose-200`.
Thin-file chip: `bg-amber-50 text-amber-800 border border-amber-300/90 rounded-full px-2.5 py-0.5 text-xs font-medium`.
"How it works" step chips (32×32, `rounded-lg`, `font-bold text-xs`, border 70%): step 1 teal (50/200/700), step 2 indigo (50/200/700), step 3 sky (50/200/700), step 4 emerald (50/200/700).

Colour must never be the only carrier of meaning: bands always have a text label; factor bars always have a signed number.

### 4.2 Typography

Two families: **Inter** (body, UI) and **Plus Jakarta Sans** (`font-display`: the wordmark and every `h1`/`h2`).

| Role | Style |
|---|---|
| Home H1 | `text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight leading-[1.15]` |
| Page H1 | `text-2xl sm:text-3xl font-bold tracking-tight` |
| Home section H2 ("How it works", "What this is not") | `text-xl font-bold tracking-tight` (What this is not: `text-lg`) |
| Card title | `text-base font-bold` (Result "Why the model said this": `text-lg`) |
| Chart / sub-section H3 | `text-sm font-bold` |
| Lead paragraph | `text-sm sm:text-base text-slate-600` (Home hero: `text-base sm:text-[17px] leading-relaxed max-w-2xl`) |
| Body / list | `text-sm leading-relaxed` |
| Helper, table cell on mobile | `text-xs` |
| Eyebrow pill (Home) | `text-xs font-semibold tracking-wider uppercase text-teal-800`, pill `px-3 py-1 bg-teal-50 border border-teal-200/80`, 6px teal-600 dot |
| Result card eyebrow | `text-xs font-bold uppercase tracking-wider text-slate-500` |
| Big result number | `text-5xl font-extrabold tracking-tight tabular-nums` |
| KPI number | `text-2xl sm:text-3xl font-extrabold tabular-nums` |
| Field label | `text-xs font-semibold text-slate-700` |
| Table head | `text-xs font-semibold text-slate-500`, body `text-xs sm:text-sm` |
| Wordmark | Plus Jakarta Sans `font-bold text-[17px] tracking-tight`; "Credit" in slate-900, "Lens" in teal-700 |

Minimum text size anywhere: 12px.

### 4.3 Shape and spacing

- Container `max-w-6xl` (1152px), side padding 16 / 24 / 32 at base / `sm` / `lg`.
- **Cards**: `bg-white rounded-2xl border border-slate-200/90 shadow-card`, padding `p-6 sm:p-7` (forms and Batch results: `p-6 sm:p-8`). Hover on "How it works" cards: `shadow-card-hover`.
  - `shadow-card`: `0 1px 3px 0 rgba(15,23,42,.04), 0 1px 2px -1px rgba(15,23,42,.03)`
  - `shadow-card-hover`: `0 10px 25px -5px rgba(15,23,42,.06), 0 4px 10px -4px rgba(15,23,42,.04)`
- Banners, KPI tiles, summary strips, upload box, table wrappers: `rounded-xl`. Banners `px-4 py-3`.
- **Buttons**: `rounded-xl px-5 py-3 text-sm font-semibold`, min-height 44. Primary `bg-teal-600 hover:bg-teal-700 text-white shadow-sm`. Secondary `bg-white hover:bg-slate-50 text-slate-800 border border-slate-300`. Compact (download, file chooser): `px-3.5 py-2 text-xs font-semibold text-teal-700`.
- **Inputs and selects**: `w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500`, min-height 44, focus `border-teal-600 ring-2 ring-teal-500/20`; selects `appearance-none pr-9` with a chevron icon.
- Form grids: `grid-cols-1 sm:grid-cols-3 gap-4` (Past loans: `sm:grid-cols-2`); each fieldset has an `h2` with `pb-2 border-b border-slate-100`.
- Page grids (12-col, `gap-7`/`gap-6`): Home hero `lg:` 7 / 5 (`gap-8 lg:gap-10`); How it works `sm:2 lg:4` cols `gap-5`; Score `lg:` 8 / 4; Result `lg:` 5 / 7; Batch top row `lg:` 5 / 7; Report calibration + fairness `lg:` 1 / 1; KPI tiles `sm:2 lg:4`. Stack to one column below `lg`.
- Focus (all interactive elements): `outline: 2px solid #0D9488; outline-offset: 2px` on `:focus-visible`, never removed.
- Min touch target 44×44 (the 18px slider thumb sits in a 44px-tall hit area).
- Range sliders: custom — track 6px `#E2E8F0` fully rounded; thumb 18px circle, 2.5px white border, shadow `0 1px 4px rgba(15,23,42,.25)`, hover scale 1.12; approve thumb `#0D9488`, reject thumb `#E11D48`.

### 4.4 Logo (the CreditLens mark, copy exactly)

Tile: 36×36, `rounded-xl bg-gradient-to-br from-teal-500 via-teal-600 to-indigo-800 text-white shadow-sm ring-1 ring-inset ring-white/20`, hover `shadow-md scale-[1.03]` (200ms). Inside, a 20×20 SVG (`aria-hidden`):

```svg
<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <circle cx="11.5" cy="11.5" r="7.5" stroke="currentColor" stroke-width="1.85" stroke-opacity="0.92"/>
  <path d="M17 17L20.5 20.5" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/>
  <rect x="8.25" y="12.25" width="1.7" height="3.25" rx="0.85" fill="currentColor" fill-opacity="0.75"/>
  <rect x="10.75" y="9.75" width="1.7" height="5.75" rx="0.85" fill="currentColor" fill-opacity="0.9"/>
  <rect x="13.25" y="7.5" width="1.7" height="8" rx="0.85" fill="#A7F3D0"/>
</svg>
```
Followed by the wordmark `Credit` + `Lens` (4.2). Also use the tile as the favicon (export as SVG).

### 4.5 Responsive

Breakpoints are Tailwind's (`sm` 640, `md` 768, `lg` 1024). Nav collapses to the hamburger below `md`; multi-column grids stack below `lg`. Tables scroll horizontally inside an `overflow-x-auto` wrapper (Batch `min-w-full`, Report performance table 720). No horizontal page scroll at 360px. Test at 360, 768, 1280.

## 5. Shared components

- **Banner** `{variant: 'info'|'warn', children}`: info = `info-bg`/`info-border` with a 8px `info-dot` before the text (`flex items-center gap-2.5`); warn = `warn-bg`/`warn-border`; 1px border, `rounded-xl px-4 py-3`, `text-xs sm:text-sm`. `role="note"`. Bold lead-in phrase then text.
- **Card**: section 4.3. Renders `<section>` with an `aria-labelledby` heading.
- **Field** `{id, label, helper?, error?, ...input}`: label `text-xs font-semibold text-slate-700 mb-1.5` above the control; helper `text-xs text-slate-500 mt-1.5 leading-snug` below, linked with `aria-describedby`; error `text-xs` `error` below with `role="alert"` and the control gets a 2px `error` border.
- **BandPill** `{band: 'Approve'|'Review'|'Reject'}` uses the pill tokens.
- **FileChip** `{thin: boolean}`: thin → amber-outlined chip `Thin-file`; thick → plain text `Thick-file` in `muted`.
- **KpiTile** `{label, value, sub, tone}`: tones neutral (bg `bg`, border `border`), approve, review, reject (tokens in 4.1). `rounded-xl p-4 space-y-1`. Tones: neutral `border-slate-200/90 bg-slate-50/70` (label `text-slate-600`, sub `text-slate-500`); approve `border-teal-200/80 bg-teal-50/60` (label teal-800); review `border-amber-200/80 bg-amber-50/65` (label amber-800); reject `border-rose-200/80 bg-rose-50/60` (label rose-800). Label `text-xs font-medium/semibold`, value 4.2 KPI number, sub `text-xs text-slate-600`.
- **DataTable**: wrapper `overflow-x-auto rounded-xl border border-slate-200/90`; `divide-y divide-slate-200` table; header row bg `thead`, `<th scope="col">` `py-3 px-4 text-xs font-semibold text-slate-500`; body `divide-y divide-slate-100 bg-white`, cells `py-3.5 px-4`, row hover `bg-slate-50/70`. Never put `display:flex` on a `<td>`/`<th>`; wrap the content in an inner `inline-flex` span instead. First-column cell is `<th scope="row">`. Numbers right-aligned.

## 6. Screens

### 6.1 Home — `/`

Home uses `space-y-10`.

**Layout note for all of section 6:** any `flex-basis`, pixel padding or radius numbers below came from an earlier mockup. Layout proportions, paddings, radii and colours come from the prototype and section 4 (grids and card styles in 4.3). The content, order, behaviour and copy in section 6 stay as written.

1. **Hero** (flex-wrap, gap 32, items centred)
   - Left (flex 1.3 1 480px): eyebrow pill `RESEARCH DEMO · CREDIT RISK` (4.2); H1 `Does a credit model work for people with no credit history?`; lead (max-width 600); buttons: primary `Try the demo` → `/score`, secondary `Read the model report` → `/report`.
   - Right (flex 1 1 360px) card padding 24: H2 `What you can do here` (16/24) then three link rows with a right chevron (`w-4 h-4 text-slate-400`; on hover teal-600 and `translate-x-0.5`), each a block link with top border 1px `border`, padding 14px 0 (last row padding-bottom 0): title (14/600 `primary`) + description (13/18 `muted`). Rows → `/score`, `/batch`, `/report`. Copy in 7.2.
2. **How it works**: H2 then 4 cards (padding 24): a 32×32 numbered chip (per-step colour, 4.1) with the number, H3 title, 14/20 `muted` text. Steps: Train, Segment, Explain, Check.
3. **What this is not**: warn-style card (`bg-amber-50/75 rounded-2xl border border-amber-200/90 p-6 sm:p-7`), H2 `text-lg font-bold`, list `list-disc pl-4 marker:text-amber-600`, a bullet list (14/20, gap 8) with a bold lead-in per item. 5 items, copy in 7.2.

### 6.2 Score an applicant — `/score`

Main padding 40px 32px 64px. H1 `Score an applicant`, lead (max-width 640, margin-bottom 32). Two-column flex-wrap, gap 24, `align-items: flex-start`.

- **Form card** (flex `999 1 560px`, padding 32, inner gap 32) with three `<fieldset>`s (legend 16/24 600, margin-bottom 16):
  - **The loan**: Loan type (select, from `/meta`), Loan amount requested, Monthly repayment, Price of the goods being financed.
  - **The applicant**: Annual income, Years in current job, Months of credit-bureau history (helper: `Enter 0 if there is no bureau record. This is what marks a thin-file applicant.` — **but see 11: this helper text depends on the final thin-file rule; read it from `/meta` when provided**).
  - **Past loans**: Previous loans with this lender, Previous late payments.
  - Submit row: primary button `Estimate risk`; next to it 13/18 `subtle` text shown **only in mock mode**: `Preview: this opens a sample result.`
- **Side column** (flex `1 1 300px`, gap 24): card `What you get back` (3 bullets), card `Good to know` (3 bullets), info note `Provisional fields.` — the info note is shown **only while `/meta.fields_final` is false**.

**Form is schema-driven.** Render the fields from `GET /api/meta` (`fields[]`: `id`, `label`, `group`, `type`, `min`, `max`, `step`, `placeholder`, `helper`, `required`), not hard-coded JSX, so the final feature list from the real data drops in without a UI rewrite. Mock `/meta` returns exactly the fields above (section 10). Loan type options come from `/meta.loan_types` (`value`, `label`); the helper under it is shown only while loan types are provisional: `Provisional options. The final list comes from the real data.`

**Behaviour**
- Validate on submit and on blur: required, numeric, `>= min`, `<= max`. Error text e.g. `Enter a number of 0 or more.` Focus the first invalid field. Numeric inputs use `type="number"`, `inputMode` numeric/decimal, no spinners required.
- Submit → `POST /api/score`. Button shows `Estimating…`, `aria-busy`, disabled. Success → navigate to `/score/result`, passing the response in router state. Failure → red-bordered alert at the top of the form card: `Could not get an estimate. Check the values and try again.` (+ server `detail` if provided). Keep form values.
- Do not persist form values anywhere (no localStorage, no URL params). Applicant data is not stored by the UI.

### 6.3 Result — `/score/result`

Route guard: if there is no result in router state (direct visit or refresh) → redirect to `/score`. Do not re-fetch or fabricate.

Main padding 32px 32px 64px, gap 24. Order:
1. `Sample output` banner if `is_sample`.
2. H1 `Result`.
3. Two columns (flex-wrap, gap 24, `align-items: flex-start`):
   - **Left** (flex `1 1 400px`, gap 24):
     - **Estimate card** (padding 32): card eyebrow `Estimated chance of repayment difficulty`; big number (e.g. `14%`, rounded to whole % for display; one decimal is shown in the reconciliation row); range line `Range for this applicant: 10% to 19%` (14/20 `muted`) — **render only if the API returns `range`**; if `is_sample` the word is `Sample range for this applicant: …`. Then the **RiskBar** (6.3.1). Then note `Band cutoffs are illustrative assumptions, not lender policy.` (13/18 `subtle`).
     - **Thin-file card** — only if `is_thin_file`: warn card, padding 24, H2 `Thin-file applicant` (16/24 600), text from 7.5.
   - **Right**: card (flex `1.4 1 480px`, padding 32) `Why the model said this` — **FactorBars** (6.3.2).
4. Button row (gap 12): primary `Score another applicant` → `/score`, secondary `See how reliable the model is` → `/report`.

#### 6.3.1 RiskBar
`role="img"` with `aria-label` = `Risk scale from 0 to 40 percent with a marker at {x} percent, in the {lower|moderate|higher} band`. Container `position: relative; padding-top: 14px`. Bar: flex, `h-3 rounded-full overflow-hidden gap-0.5 bg-slate-100`, three segments with flex `25 / 25 / 50` coloured `riskbar-lower/moderate/higher` (these are the 0–10, 10–20, 20–40 ranges on a 0–40 scale). Marker: a down-pointing triangle (CSS borders 6/6/8, colour `ink`) centred (`-translate-x-1/2`) at `left = clamp(risk,0,40)/40 * 100%`, `top: 0`. Labels under each segment (`text-xs text-slate-500`, `grid grid-cols-4`, third label spans 2): `Lower (under 10%)`, `Moderate (10–20%)`, `Higher (over 20%)`. Band thresholds are `DEFAULT_APPROVE = 10`, `DEFAULT_REJECT = 20` from `config/project.ts`. Risk ≥ 40 pins the marker at the right edge.

#### 6.3.2 FactorBars (SHAP)
Intro: H2 `Why the model said this` (20/28 600) + `How each input moved the estimate away from an average applicant. Sample values, in percentage points.` (14/20 `muted`; drop the word "Sample" when not `is_sample`). Legend (13/18, gap 16): amber-600 12px square `Raises the estimate (+)`, teal-600 12px square `Lowers the estimate (−)`.

Rows (gap 12), one per factor, flex-wrap:
- label (flex `1 1 180px`, 14/20),
- track (flex `3 1 240px`, min-width 0): a flex row `[left half][2px × 28px ink centre line][right half]`. Positive values draw in the right half: amber-600 bar, `h-4`, `rounded-r-md`. Negative values draw in the left half, right-aligned: teal-600 bar, `h-4 rounded-l-md`. Centre line `w-0.5 h-6 bg-slate-800`. Rows use a 12-col grid: label 5 (4 from `sm`), track 5 (6 from `sm`), value 2; labels `truncate` with a `title`.
- value (flex `0 0 56px`, right-aligned, 14/600): positive in `amber-text` (amber-700) with `+`, negative in `primary-text` (teal-700) with `−` (U+2212), one decimal.

Bar width (% of its half) = `|v| / max(5, maxAbsShown) * 100`. (Mockup: 4.1 → 82%, 3.0 → 60%, 1.7 → 34%, 2.4 → 48%, 1.5 → 30%.)

Row order: positives by size descending, then negatives by size descending. Show the **top 5** by absolute value; everything else is merged into one line below the bars: `All other inputs combined` … `+0.1` (13/18 `muted`, value 600).

Reconciliation panel (margin-top 20, padding 16, bg `bg`, 1px `border`, radius 8, 13/18 `muted`, flex-wrap, space-between): `Average applicant **9.0%**` · `Sum of all factors **+5.0**` · `This applicant **14.0%**` (bold values in ink). Values: `base_rate`, `risk − base_rate`, `risk`, all in percent with one decimal.

**Reconciliation invariant (must hold):** `sum(top5.value_pp) + other_pp == risk_pp − base_pp` within 0.05. Enforce in the mapper: compute `other_pp = (risk_pp − base_pp) − sum(top5)` so it always reconciles, and **log a console error in dev if the API's own `other_pp` differs by more than 0.05**. Round for display only after summing.

Footnote (13/18 `subtle`, margin-top 20): `These bars describe how the model reached its number. They are not evidence of why a person might struggle to repay.`

### 6.4 Batch scoring — `/batch`

Main padding 32px 32px 64px, gap 24. Order:
1. `Sample output` banner when `is_sample` (copy 7.6, mock mode only).
2. Heading block: H1 `Batch scoring`, lead (max-width 680).
3. Row of two cards (flex-wrap, gap 24, stretch):
   - **1. Upload applicants** (flex `1 1 380px`, padding 24): H2; dashed box (`rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-4`): title `Applicant file (CSV)`, a styled `Choose File` button (a `<label>` wrapping a **visually hidden** `<input type="file" accept=".csv">`, never `display:none`, with `focus-within` ring) next to the chosen file name (`aria-live="polite"`), helper (13/18 `subtle`) `One row per applicant. Columns must match the model's input fields. This demo ships no sample data, so bring your own file.` Under it, a link-style button `Download blank column template (CSV)` (header row only, built from `/meta.fields`; this is an addition, see 14).
   - **2. Set the cutoffs** (flex `1.4 1 480px`, padding 24): H2; two sliders side by side (flex-wrap, gap 24, each flex `1 1 220px`):
     - `Approve below` — value label right-aligned in `primary-text` bold `{n}%`; `<label for>` bound to the slider; custom slider (4.3), min 1, max 30, step 0.5; default **10.0**.
     - `Reject above` — value label in `reject-text` (rose-700) bold; `<label for>` bound; custom slider (4.3), min 10, max 40, step 0.5; default **20.0**.
     - Helper below: `Anything between the two goes to review. Cutoffs are illustrative assumptions, not lender policy.`
     - **Invariant: reject ≥ approve.** Moving Approve above Reject pushes Reject up to equal it. Moving Reject below Approve is clamped to Approve. Values display with one decimal. Update continuously while dragging (React `onChange`), not on release.
4. **3. Results** card (padding 32). Before any file is uploaded (non-mock) show an empty state instead of results: `Upload a file to see results.` Otherwise:
   1. **KPI row** (flex-wrap, gap 16): `Applicants scored` (neutral; value `n` with thousands separators; sub `{n_thin} thin-file ({pct}%)`), `Approve`, `Review`, `Reject` tiles (value = count, sub = `{pct}% of file`). In mock mode label is `Applicants scored (sample)`.
   2. **Stacked bar** (`h-2.5 rounded-full overflow-hidden bg-slate-100`): `role="img"` `aria-label="Stacked bar showing the share of applicants in approve, review and reject bands"`; three segments with width = percentage, colours teal-600, amber-300, rose-600, width transition 200ms.
   3. **Risk distribution** (H3 16/24 600): helper `How many applicants fall at each risk level, on an illustrative sample of 1,000. Bars change colour as you move the cutoffs.` (replace "an illustrative sample of 1,000" with `this file` when not sample) + Histogram (6.4.1).
   4. **Ranked list** header row: H3 `Ranked list, lowest risk first` + compact secondary button `Download ranked list (CSV)`; then the table (6.4.2); then the footnote.

**Counting rule (exact):** `risk < approve` → Approve; `risk > reject` → Reject; otherwise (including exactly equal to either cutoff) → Review. Counts, percentages, stacked bar and table pills are all derived from the same function `bandFor(risk, approve, reject)` in `lib/bands.ts`. Percent = `count / n * 100`, one decimal, and the three percentages must be displayed so they add to 100.0 (apply largest-remainder rounding).

#### 6.4.1 Histogram
- Input: array of risk values (percent). **Bins: 16 bins of 2.5pp from 0 to 40; the last bin (37.5–40) also holds everything ≥ 40.** Height of a bar = `count / maxCount * 100%` of a 176px-high (`h-44`) plot area.
- Plot: `relative h-44 flex items-end gap-1.5 border-b border-slate-300 px-1`. Bars `flex-1 rounded-t-md`, height transition 150ms, `title` tooltip `2.5%–5.0%: 170 applicants`. Empty bins render at 0 height (no minimum).
- Bar colour by bin midpoint: `mid < approve` → teal-600; `mid > reject` → rose-600; else amber-300 **with a 1px amber-600 border** (needed for 3:1 non-text contrast).
- Two cutoff lines: absolutely positioned, `top:0; bottom:0`, `left = cutoff/40*100%`, `border-left: 2px dashed` slate-700, `pointer-events: none`, `left` animates 150ms.
- X-axis labels under the plot: `0%  10%  20%  30%  40%+`, each **absolutely positioned at 0, 25, 50, 75, 100%** of the plot width so they line up with the bars and cutoff lines (`text-xs text-slate-500 tabular-nums`); axis title centred `Estimated risk of repayment difficulty`.
- Legend (12/16 `muted`, gap 8px 20px): 10×10 squares for `Approve` (teal-600), `Review` (amber-300 + amber-600 border), `Reject` (rose-600); then a dashed 2px line sample `Your cutoffs`.
- `role="img"`, `aria-label` = `Histogram of estimated risk for {n} applicants, with cutoffs at {approve} and {reject} percent`. Also render a visually-hidden table of the 16 bin counts for screen readers.
- Note: KPI counts are exact (computed per row). Bars in a bin that straddles a cutoff are coloured by midpoint, so colour is approximate at the boundary. This is acceptable; do not "fix" it by splitting bars.

#### 6.4.2 Ranked table
Columns: `Rank`, `Applicant`, `Risk estimate` (right-aligned, e.g. `14.2%`), `Decision band` (BandPill), `File` (FileChip), `Main reason`. Sorted by risk ascending. Applicant id is the first-column `<th scope="row">` (600). Table min-width 760 in an `overflow-x:auto` wrapper.
- Real files can have ~50,000 rows. **Paginate: 50 rows per page** with `Previous` / `Next` and `Showing {a}–{b} of {n}`. Never render all rows at once.
- Footnote under the table (13/18 `subtle`): mock mode: `Showing 7 sample rows of 1,000. The real list shows every applicant in the file. Thin-file applicants are flagged because their estimates are less certain, so a review band is not a rejection.` Real mode: same text without the first two sentences.
- `Main reason` = the label of the largest positive SHAP contribution for that applicant, supplied by the API as `top_reason` (a plain phrase). Show `—` if absent.

**CSV download.** Contents are the full sorted list under the **current cutoffs**: `rank,applicant_id,risk_percent,band,file_type,main_reason`. Filename `ranked-applicants.csv`. **CSV-injection guard:** any cell that starts with `=`, `+`, `-`, `@`, tab or CR gets a leading `'`. Escape quotes and commas per RFC 4180. Unit-test this.

**Upload handling.** Accept `.csv` only; reject over **50 MB** or over **100,000 rows** with `That file is too large for this demo.` Send as `multipart/form-data` to `POST /api/score/batch`. Show `Scoring…` with `aria-busy`. On a 422 with `row_errors`, show a list of up to 10 errors (`Row 14: Months of credit-bureau history must be a number.`) plus `and N more` and do not show results. Files are never stored client-side.

### 6.5 Model report — `/report`

Main padding 40px 32px 64px, gap 32. All data from `GET /api/report`. Order:

1. H1 `Model report`, lead `How well the model works, for whom, and where it should not be trusted.`
2. **If `model_trained` is false:** warn banner (14/20): `**No model has been trained yet.** Dashes below fill in from the held-out evaluation once training is done. Nothing on this page is a result.` All metric cells render `—` (colour `subtle`). **If true:** replace the banner with an info banner containing `evaluation_note` from the API (what was held out, how split). Never show both.
3. **Performance by applicant group** card (padding 32): H2 20/28, helper `The main question: does the model work as well for thin-file applicants as for everyone else? Intervals are shown where a group is small.` Table (min-width 720): columns `Group`, `Applicants`, `Default rate`, `ROC-AUC`, `PR-AUC`, `KS`, `Calibration error`, `95% interval (AUC)`. Rows: `Thin-file` (8px amber dot), `Thick-file` (8px primary dot), `All applicants` (8px ink dot, row bg `thead`). If the API row has `inconclusive: true`, the metric cells show `Inconclusive` (not numbers) and a note under the table: `The thin-file group is too small for a firm answer. The group definition was not changed to get a result.` Formats: counts with thousands separators; rates as `x.x%`; AUC/PR-AUC/KS/calibration error with 3 decimals; interval `0.712–0.768`.
4. **Two cards side by side** (flex-wrap, gap 24, each flex `1 1 420px`, padding 32):
   - **Calibration** — H2, helper `When the model says 20%, do about 20% of those applicants really struggle? Points near the dashed line mean yes.` + CalibrationChart (6.5.1).
   - **Fairness checks** — H2, helper `Gender and age are not model inputs, but the model can still treat groups differently. Large gaps are reported as findings, not hidden.` Table (min-width 360): `Group`, `Error rate`, `Calibration gap`. Mockup shows 3 rows (`By gender`, `By age band`, `Thin vs thick file`). Real data: one **section row** per dimension, then one sub-row per group value (e.g. `Female`, `Male`; `Under 30`, `30–44`, …). Group values come from the API; do not hard-code them.
5. **How it will be evaluated** card (padding 32): H2 20/28 + 4 bullets (14/20, gap 10), copy in 7.7. The thin-file rule bullet comes from `/meta.thin_file_definition`.
6. **Limits you should know about**: warn-style section (padding 32), H2 20/28 + 6 bullets, copy in 7.7.

#### 6.5.1 CalibrationChart
SVG `viewBox="0 0 360 240"`, `class="w-full max-w-md mx-auto overflow-visible"`, `role="img"`.
- Plot area: x from 56 to 310 (254 wide), y from 195 (bottom) to 28 (top) (167 high). Axes stroke `#94A3B8` 1.5: y-axis (56,20)→(56,195), x-axis (56,195)→(325,195). Grid lines `#F1F5F9` at the tick positions.
- Both axes share range `[0, axisMax]` where `axisMax` = max of all predicted and observed values rounded **up** to the next 0.05 (min 0.1), as a fraction. In the empty state use 0–40% so it matches the Batch histogram axis.
- Mapping: `x = 56 + (pred/axisMax) * 254`, `y = 195 − (obs/axisMax) * 167`.
- Reference diagonal: dashed (`5,5`), stroke `#475569` 1.5, from (56,195) to (310,28) (perfect calibration).
- Ticks at 0, axisMax/2, axisMax on both axes: 5px marks (stroke `#64748B`) and 11px labels (`#475569`) formatted as percent; x labels at y=214, y labels right-aligned at x=46.
- Series: one polyline + circles (r=4) per group from `calibration[]`: thin-file `amber`, thick-file `primary`, all `ink`. Show the `all` series by default plus a small legend. Series data is the API's decile bins (`pred`, `obs`, `n`).
- Axis titles (11px, weight 500, `#475569`): x `Predicted risk` centred at (190,234); y `Observed default rate` rotated −90 at (14,110).
- If `calibration` is empty: draw axes, grid, ticks and diagonal and the centred text `Chart appears after evaluation` (12px `#475569`, at 195,156). `aria-label` = `Empty calibration chart with a dashed diagonal reference line, to be filled after evaluation` in that state; otherwise `Calibration chart: predicted risk versus observed default rate by group`. Provide a visually-hidden table of the plotted points.

### 6.6 404 — `*`
Plain card with `Page not found` and a link to `/`. Keep banner/header/footer.

## 7. Copy (final; do not reword)

### 7.1 Global
- Top banner: `Research demo. Not a lending decision. Nothing here is a real score or a real applicant.`
- Footer: `Research and portfolio project. Uses the Home Credit Default Risk dataset from Kaggle under Kaggle's competition rules. Not affiliated with Home Credit or Kaggle. Source: {REPO_URL}`

### 7.2 Home
- Eyebrow: `Research demo · Credit risk`
- H1: `Does a credit model work for people with no credit history?`
- Lead: `Lenders score applicants from their past borrowing. Applicants with little or none, called thin-file, are the hardest to score. This project trains a default-prediction model, then tests how well it does for them and how well it explains itself.`
- Buttons: `Try the demo`, `Read the model report`
- Card `What you can do here`:
  - `Score one applicant` — `Enter a few details and see a risk estimate and the factors behind it.`
  - `Score a file of applicants` — `Upload a CSV, set cutoffs, and get a ranked list in approve, review and reject bands.`
  - `Read the evaluation` — `Performance for thin-file and thick-file applicants, calibration, fairness checks and limits.`
- H2 `How it works`:
  1. `Train` — `A gradient-boosted model learns from past loan applications where the repayment outcome is known.`
  2. `Segment` — `Applicants are split into thin-file and thick-file by bureau history. The rule is fixed before looking at outcomes.`
  3. `Explain` — `Every score comes with the inputs that pushed it up or down, calculated with SHAP.`
  4. `Check` — `Accuracy, calibration and error rates are reported per group, including gender and age bands.`
- H2 `What this is not` (bold lead-in, then text):
  - `Not a lending tool.` `It must not be used to approve or reject a real applicant.`
  - `Not every loan type.` `The model covers only the loan types in its training data, to be confirmed once the data is inspected. It is not a home-loan model.`
  - `Not Indian borrower data.` `The model is trained on Home Credit applications from a Kaggle competition.`
  - `Not trained yet.` `Every number in this mockup is sample output that shows layout only.` — **shown only while `/meta.model_trained` is false**
  - `Not shipped with data.` `The data's licence limits its use, so this project distributes no data and no trained model. You train it yourself from your own download.`

### 7.3 Score
- Lead: `Enter a few details about a loan application. You get a risk estimate, a note on whether the applicant is thin-file, and the main factors behind the number.`
- `What you get back`: `An estimated chance of repayment difficulty` · `Whether the applicant counts as thin-file, and how that affects confidence` · `The inputs that pushed the estimate up or down`
- `Good to know`: `Gender and age are not inputs to the model.` · `No applications from the training data are shown anywhere in this demo.` · `This is a research and portfolio project, not a lender's tool.`
- Info note (while fields not final): `**Provisional fields.** The final input list follows the real feature set once the data has been inspected.`
- Mock field list (also the `/meta` mock): Loan type (select) · Loan amount requested (placeholder `e.g. 250000`) · Monthly repayment (`e.g. 12000`) · Price of the goods being financed (`e.g. 225000`) · Annual income (`e.g. 180000`) · Years in current job (`e.g. 3`, decimal) · Months of credit-bureau history (`0 if none`) · Previous loans with this lender (`e.g. 1`) · Previous late payments (`e.g. 0`).

### 7.4 Result
Strings are in section 6.3.

### 7.5 Thin-file card text
`This applicant is thin-file under this project's rule: {thin_file_short}. The model has less to go on here, so treat the estimate as less certain and read the range, not just the single number.` — drop the last clause `and read the range, not just the single number` when no `range` is returned. `{thin_file_short}` comes from `/meta.thin_file_short`.

### 7.6 Batch
- Sample banner: `**Sample output.** This screen shows layout only. The applicants and risk numbers below are placeholders. The cutoff sliders work on an illustrative sample of 1,000 applicants.`
- Lead: `Score a whole file of applications at once. You get a ranked list, risk bands, and how many applicants fall into approve, review and reject at the cutoffs you choose.`
- Section headings: `1. Upload applicants`, `2. Set the cutoffs`, `3. Results`.

### 7.7 Report
- How it will be evaluated (bold lead-in):
  - `Thin-file rule:` `{thin_file_definition}`
  - `Main metric:` `ROC-AUC, to be confirmed against the competition page. Also reported: PR-AUC, KS, Brier score and calibration.` (drop "to be confirmed…" once confirmed; see 11)
  - `Small groups:` `95% bootstrap intervals. If the thin-file group is too small for a firm answer, the report says "inconclusive" and does not redefine the group to get a result.`
  - `Fairness:` `error rates and calibration compared across gender and age bands. Gaps are reported as findings; no mitigation is claimed.`
- Limits you should know about:
  - `The model is trained on Home Credit applications from a Kaggle competition. It does not describe Indian borrowers.`
  - `The data is used under Kaggle's competition rules, so this project ships no data and no trained model file. You train it yourself from your own download.`
  - `The data may not include application dates, so evaluation uses random splits, not a test that moves forward in time.`
  - `The thin-file group may be too small for firm conclusions.`
  - `Risk bands and cutoffs are illustrative assumptions, not lender policy.`
  - `This is a research and portfolio project. It must not be used to approve or reject a real applicant.`

## 8. States (every data-driven screen)

| State | Behaviour |
|---|---|
| Loading | Skeleton blocks in the card shapes (no spinners over content), `aria-busy="true"` |
| Error (network / 5xx) | In-card alert: `Something went wrong loading this. Try again.` + `Retry` secondary button. Never show stale or mock numbers as a fallback |
| API unreachable on `/meta` | Whole app shows a centred card: `The scoring service is not available right now.` Home, Report copy, and static pages still render |
| Empty | Batch before upload: `Upload a file to see results.` |
| Validation | Per section 6.2 / 6.4 |

## 9. API contract (frontend is written against this; backend is a separate task)

Base URL from `VITE_API_BASE_URL` (default `/api`). All JSON, all numbers as JSON numbers. **Risks are fractions 0–1** on the wire; the UI converts to percent. **Contributions are in percentage points** (a value of `4.1` means +4.1 pp of default probability). Validate every response with zod; fail loudly in dev.

```
GET /api/meta
→ {
  model_trained: boolean,
  is_sample: boolean,                 // true only from the mock layer
  fields_final: boolean,
  loan_types: [{ value: string, label: string }],
  loan_types_final: boolean,
  fields: [{
    id: string, label: string, group: "The loan"|"The applicant"|"Past loans",
    type: "number"|"select", min?: number, max?: number, step?: number,
    placeholder?: string, helper?: string, required: boolean
  }],
  thin_file_definition: string,       // full sentence for the Report
  thin_file_short: string,            // short clause for the Result card
  default_approve: number,            // percent, default 10
  default_reject: number              // percent, default 20
}

POST /api/score        body: { [field.id]: number | string }
→ {
  is_sample: boolean,
  risk: number,                       // 0–1
  range?: [number, number],           // 0–1, omit if not computed
  base_rate: number,                  // 0–1, average applicant
  is_thin_file: boolean,
  contributions: [{ feature: string, label: string, value_pp: number }],  // all features, any order
  other_pp?: number                   // optional; UI recomputes (6.3.2)
}

POST /api/score/batch  multipart: file=<csv>
→ {
  is_sample: boolean,
  n: number, n_thin: number,
  rows: [{ id: string, risk: number, is_thin_file: boolean, top_reason?: string }]
}
422 → { row_errors: [{ row: number, message: string }], detail?: string }

GET /api/report
→ {
  model_trained: boolean, is_sample: boolean,
  evaluation_note?: string,
  groups: [{
    key: "thin"|"thick"|"all", n?: number, default_rate?: number,
    roc_auc?: number, pr_auc?: number, ks?: number, calibration_error?: number,
    auc_ci?: [number, number], inconclusive?: boolean
  }],
  calibration: [{ key: "thin"|"thick"|"all", points: [{ pred: number, obs: number, n: number }] }],
  fairness: [{ dimension: string, groups: [{ label: string, error_rate?: number, calibration_gap?: number }] }]
}
```

Notes the backend author must know (and the frontend must not paper over):
- **SHAP units.** TreeSHAP natively explains log-odds, not probability points. The backend must supply `value_pp` that actually sums to `risk − base_rate` (e.g. by explaining the calibrated probability, or scaling log-odds contributions proportionally). The UI trusts `risk` and `base_rate` and recomputes `other_pp` so the displayed panel always reconciles, but it cannot repair a wrong attribution.
- **`range`** requires an uncertainty method (bootstrap ensemble or conformal intervals). If the backend does not implement one, it omits `range` and the UI hides the range line. Do not fake one.

## 10. Mock layer (so the UI can be built and tested before any model exists)

`VITE_USE_MOCK=true` (default in dev) routes `api/client.ts` to `api/mock.ts`. Every mock response has `is_sample: true`, `model_trained: false`, `fields_final: false`, `loan_types_final: false`.

- `/meta`: the nine fields in 7.3; loan types `cash` → `Cash loan`, `revolving` → `Revolving loan`; `thin_file_definition`/`thin_file_short` use the placeholder strings from section 11; defaults 10 and 20.
- `/score`: deterministic fixture matching the mockup: `risk 0.14`, `range [0.10, 0.19]`, `base_rate 0.09`, `is_thin_file true`, contributions `Loan amount vs income +4.1`, `Months of bureau history +3.0`, `Monthly repayment vs income +1.7`, `Years in current job −2.4`, `Previous late payments −1.5`, plus two small ones summing to `+0.1`. (Check: 4.1+3.0+1.7−2.4−1.5+0.1 = +5.0; 9.0 + 5.0 = 14.0.)
- `/score/batch`: ignore the upload; return 1,000 synthetic rows from the cumulative curve below. Ids `App-NNNNN`, ~31.2% `is_thin_file`, `top_reason` from a short fixed list.
- `/report`: `model_trained: false`, groups all-`undefined`, empty `calibration`, empty `fairness` groups (renders dashes).

**Synthetic risk distribution** (piecewise-linear CDF; sample risks by inverse-transform):

```
x (risk %): 0  2.5   5   7.5  10    12.5  15    17.5  20   22.5  25    27.5  30   32.5  35   37.5  40
F(x):       0  .150 .320 .480 .624  .714  .786  .838  .880 .910  .934  .954  .970 .982  .990 .996  1
```
At default cutoffs 10 / 20 this gives **624 approve / 256 review / 120 reject** out of 1,000. Use this as a unit-test fixture for `bandFor` + counts.

## 11. Placeholders — unknown on purpose

Put in `src/config/project.ts`. Each is a visible, greppable token. Do not guess them.

| Constant | Placeholder value | Becomes |
|---|---|---|
| `REPO_URL` | `[YOUR REPO LINK]` | Real repo URL (owner will supply) |
| `PRODUCT_NAME` | `CreditLens` | Owner's chosen name. **Caveat:** "CreditLens" is also, to the best of our knowledge, the name of a commercial lending product from Moody's Analytics. The owner has decided to use it for this portfolio demo; the footer already says "Not affiliated" for Home Credit and Kaggle. Keep it a single constant so a rename is one line. |
| `THIN_FILE_DEFINITION` | `[DEFINITION: set from bureau coverage before looking at outcomes]` | The real rule, from `/meta` |
| `THIN_FILE_SHORT` | `[DEFINITION]` | Short clause for the Result card |
| Loan types | `Cash loan`, `Revolving loan` (provisional) | Real list from the data (not yet inspected) |
| Input fields | the nine in 7.3 (provisional) | Real feature set |
| Main metric copy | `ROC-AUC, to be confirmed` | Confirmed metric |

When `/meta` supplies a real value it overrides the constant; the constant is only the fallback.

## 12. Quality bar

### 12.1 Accessibility (WCAG 2.2 AA)
- All text meets 4.5:1 on its background; non-text UI (bars, outlines, focus) meets 3:1. `amber` #D97706 is **never used as text on white** (use `amber-text` #B45309).
- **Known gaps in the prototype's palette (owner decision; each is a one-token change):**
  - **A1. White text on `primary` buttons** (#0D9488) is about 3.7:1 and fails 4.5:1 for 14px text. Fix: set button bg to `primary-hover` #0F766E (about 5.5:1). Default in this spec: use the prototype colour; flip the token if the owner approves.
  - **A2. Input and select borders** (slate-300 #CBD5E1) are about 1.6:1 against white and fail the 3:1 non-text rule. Fix: `input-border` → #7B8794. Default: prototype colour.
  - Everything else the prototype showed as failing (placeholders, `—` cells, 11px text, the pale Review bars, missing focus rings) is already fixed in the prototype file.
- Semantic landmarks (`header`, `nav`, `main`, `footer`), one H1 per page, headings in order.
- Every input has a visible `<label>`; helper/error linked by `aria-describedby`; errors `role="alert"`.
- Charts have `aria-label` and a text/table alternative (histogram hidden table; factor bars carry signed numbers; calibration points are also available as a visually-hidden table).
- Full keyboard operation; sliders operable with arrow keys; visible focus everywhere; `prefers-reduced-motion` respected (no animation is required anyway).
- Zoom to 200% without loss of content; no horizontal scroll at 360px.

### 12.2 Performance
Initial JS < 150 kB gzipped. No chart library. Pagination on the batch table. Histogram/band counts recomputed with `useMemo`; dragging a slider over 100k rows must stay under 16 ms per update (precompute a sorted risk array once; counts via binary search; bins via a single pass cached per file).

### 12.3 Tests (must exist and pass)
Unit (Vitest):
- `bandFor`: boundaries (`risk == approve` → Review; `risk == reject` → Review).
- Counts at default cutoffs on the mock distribution = 624 / 256 / 120.
- Percent rounding: displayed `approve% + review% + reject% = 100.0`.
- Slider invariants (reject ≥ approve) in all drag orders.
- Histogram: 16 bins, overflow (≥40) in the last bin, total count equals n.
- Reconciliation: `sum(top5) + other == risk − base` within 0.05 for the mock fixture and for random inputs.
- Factor bar widths for the mock fixture: 82 / 60 / 34 / 48 / 30.
- CSV export: injection guard, quote/comma escaping.
- Route guard: `/score/result` without state redirects to `/score`.
- No `display:flex` on any `<td>`/`<th>` (lint or test); every form `<label>` has a matching control id; the file input is keyboard-focusable.
- Router: every nav item is a link with an `href`; back button and refresh keep the current page.
Component: Score form validation; Report dashes when `model_trained` is false; `inconclusive` rendering; Sample banner appears iff `is_sample`.
E2E (Playwright, mock mode): home → score → result; batch slider changes counts, bar, table pills and histogram together; report shows dashes; axe has **0 violations** on all five pages at 360 and 1280 width.

### 12.4 Release check
`npm run check:placeholders` greps `src/` and built assets for `[YOUR REPO LINK]`, `[DEFINITION`, and `is_sample` mock labels in production config, and **exits non-zero** if any remain. CI runs it on release builds only; dev builds may pass with placeholders.

### 12.5 Definition of done
1. All five routes match sections 3–6 at 360 / 768 / 1280 px.
2. Hard rules (section 1) verified by test or grep (no `localStorage` use, no external requests except the configured API, banner on every page).
3. Works fully in mock mode with no backend; switches to the real API by env var only.
4. Unit, component and e2e tests pass; axe clean.
5. `README.md` in `frontend/` with run/test/build commands and the section 11 placeholder table.

## 13. Out of scope
Backend, model training, data download, authentication, user accounts, saving or sharing results, i18n (English only), dark mode, print stylesheet, analytics, SEO beyond `<title>` and a meta description (`Research demo of a credit-risk model tested on thin-file applicants.`).

## 14. Where the real app goes beyond the prototype (the spec is correct)

The prototype is one static HTML file. The real app must differ in these ways:

| Prototype | Real app | Why |
|---|---|---|
| Hash views in one page | Real routes (React Router) | Real URLs, back button, deep links |
| Result page works on direct visit | Redirect to `/score` without state | Never fabricate a result |
| Result shows range and "0 months" thin-file text unconditionally | Range only if API returns it; thin-file text from `/meta` | A range needs a real uncertainty method; the thin-file rule is not decided |
| Form hard-coded | Form rendered from `/meta` | Real feature list is unknown |
| Loan types hard-coded | From `/meta.loan_types` | Real list unknown |
| Batch shows sample results; upload does nothing | Mock mode only; real mode shows empty state and scores the upload | Rule 2 |
| Batch counts come from a fixed 16-bin sample, using a piecewise-linear cumulative curve so half-point cutoffs are exact | Counts computed per row from the API (`bandFor`); histogram bins from the real risks | Real data |
| No column-template link | Add `Download blank column template (CSV)` | Demo ships no sample data, so users otherwise cannot know the columns |
| No validation styling | `error` token, field errors | Needed for a real form |
| Table shows 7 rows | Paginate 50/page | Real files ~50k rows |
| Calibration chart empty | Plots real points per group | Real data |
| No SHAP unit rule | Section 9 notes | TreeSHAP log-odds vs probability pp is a real trap |
| Tailwind and fonts from CDNs | Built Tailwind, self-hosted fonts | Rule 5; CDN Tailwind is not for production |

### 14.1 Regression list (the prototype was fixed for these; do not reintroduce)
1. Dark research-demo banner on every page.
2. Home "What this is not" section.
3. `<td>` with `display:flex` in the Report tables (use row-header `<th scope="row">` with an inner span).
4. Unlabeled inputs and text-type numeric inputs.
5. CSV export that ignores the current cutoffs (it must match the table and the sliders; also guards against spreadsheet-formula injection).
6. JS-only navigation with no URLs.
7. Histogram bars with a minimum height for empty bins.
8. Slider ranges that differ from this spec.
9. Display-none file input (not keyboard reachable).
10. Charts with no text alternative; calibration chart with no ticks.
11. Low-contrast helper text (slate-400), 11px text, pale Review bars with no outline, `focus:outline-none` with no replacement.
12. Tailwind-v4-only classes on a v3 build.

## 15. Visual reference
`docs/ui/creditlens_credit_risk_research_demo.html` — open it in a browser (it loads Tailwind and fonts from the internet, so it needs a connection). It contains all five screens, switched by the nav (`#/home`, `#/score`, `#/result`, `#/batch`, `#/report`). Match its look; follow this spec for everything else. The style is "CreditLens": Inter + Plus Jakarta Sans, off-white page, white rounded-2xl cards, teal primary, amber for caution, rose for reject.
