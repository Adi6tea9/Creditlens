# Report screenshot vs prototype — known differences

Comparison: `report-1280-pair.png` (left = app, right = prototype).
Prototype source: `docs/ui/creditlens_credit_risk_research_demo.html`, Report view.
App side is built with `npm run build:mock`.

Expected differences (not bugs):

1. The app fills the thin-file rule from `/meta.thin_file_definition`; the prototype shows a bracketed definition placeholder.
2. The app chart uses the specified 360×240 viewBox with three ticks, grid lines and a hidden data table; the prototype uses a shorter 360×230 viewBox with four grid lines and no ticks or table.
3. The app card titles for performance, evaluation and limits follow the spec’s 20/28px H2 style; the prototype uses 16px headings.
4. The app draws 8px dots with semantic ink/primary/amber tokens and a row header per applicant group; the prototype uses plain table cells with flex.
5. The app fairness table uses rowgroup headers for API dimensions; the empty mock state still shows the three copy-defined section rows with dashes.

Anything else in the pair should be treated as a real visual gap.
