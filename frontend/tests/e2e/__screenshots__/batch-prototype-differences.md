# Batch screenshot vs prototype — known differences

Comparison: `batch-1280-default-pair.png` and `batch-1280-approve-5.5-pair.png` (left = app, right = prototype).
Prototype source: `docs/ui/creditlens_credit_risk_research_demo.html`, Batch view.
App side is built with `npm run build:mock`.

Expected differences (not bugs):

1. The approve slider is 1–30 step 0.5 as specified; the prototype is 2.5–35 step 2.5. The 5.5 pair therefore uses the closest prototype setting, 5.0%.
2. App counts, bar and histogram come from the same 1,000 ranked rows; the prototype bins are pre-aggregated, so individual bar heights can differ slightly.
3. The app adds the blank CSV template link built from `/meta.fields` (spec addition 14); the prototype has no template link.
4. The app paginates the full ranked list 50 rows at a time with `Showing a–b of n`; the prototype shows 7 illustrative rows with no pagination.
5. The app file input is visually hidden with `sr-only` and a visible focus ring; the prototype uses `class="hidden"`.
6. The app footnote follows spec 7.6 verbatim, including the "Showing 7 sample rows..." sentence even though the table paginates all 1,000 mock rows.

Anything else in the pairs should be treated as a real visual gap.
