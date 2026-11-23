# Score screenshot vs prototype — known differences

Comparison: `score-1280-pair.png` (left = app, right = prototype).
Prototype source: `docs/ui/creditlens_credit_risk_research_demo.html`, Score view.
App side is built with `npm run build:mock` so the Preview note is present, matching the prototype.

Expected differences (not bugs):

1. Primary button base is teal-700 `#0F766E`; prototype uses teal-600 `#0D9488` (spec A1).
2. Primary button hover is teal-800 `#115E59`; prototype hovers to teal-700. Not visible in a static screenshot.
3. Input/select borders use `input-border` slate-500 `#64748B`; prototype uses slate-300 `#CBD5E1` (spec A2).
4. Empty loan-type option is the meta label `Loan type`; prototype says `Select a loan type` (owner ruling).
5. Loan-type options are `Cash loan` / `Revolving loan` from mock `/meta`; prototype says `Cash loans` / `Revolving loans`.
6. Bureau-history helper is `0 if none` from mock `/meta`; prototype shows the longer `Enter 0 if there is no bureau record…` sentence. Spec §6.2 says `/meta` wins when supplied.
7. Numeric fields are `type="number"` with native spinners; prototype uses `type="text"`.
8. Select chevron is a CSS background image; prototype uses an inline SVG. Visually near-identical.
9. Side-card headings are H2 via the shared `Card` component; prototype uses H3. Same visible text and size.
10. Good-to-know bullets use teal markers; prototype uses indigo markers for that card.

Anything else in the pair should be treated as a real visual gap.
