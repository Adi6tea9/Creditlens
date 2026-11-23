# Result screenshot vs prototype — known differences

Comparison: `result-1280-pair.png` (left = app, right = prototype).
Prototype source: `docs/ui/creditlens_credit_risk_research_demo.html`, Result view.
App side is built with `npm run build:mock`.

Expected differences (not bugs):

1. The sample banner shows only the `Sample output` label (owner ruling: keep copy.ts unchanged); the prototype adds a full explanatory sentence.
2. Thin-file text comes from spec 7.5 with `thin_file_short` from /meta; the prototype uses a shorter bespoke sentence.
3. Primary button base is teal-700 `#0F766E` with teal-800 hover (spec A1); the prototype uses teal-600.
4. Card headings are H2; the prototype uses a mix of H2/H3 with the same visible text and size.

Anything else in the pair should be treated as a real visual gap.
