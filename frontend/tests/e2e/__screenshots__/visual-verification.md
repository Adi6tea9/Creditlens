# Side-by-side PNG verification

Scope: all 12 `*pair*.png` files in this directory, including the new mocked trained `/report` capture.
Left half = CreditLens app. Right half = prototype (`docs/ui/creditlens_credit_risk_research_demo.html`).

## How these were inspected

This model cannot render PNGs visually (`read` returns “this model does not support image input”). I did **not** skip inspection; I used the available non-visual evidence for every pair:

- Full Windows OCR text for each half (`visual-audit/…-<side>.txt` in the temp audit folder).
- Pair dimensions and dark-pixel bounding boxes for each half, with the full-width demo banner excluded.
- Playwright DOM assertions for the trained state: banner swap, 3 calibration series, 3 fairness rowgroups, no clipped visible table cells, and no document horizontal overflow at 1280px and 360px.
- State-key checks (slider values, sample labels, trained/untrained markers) for every pair.

This is **not** the same as human eyeballing. See “Still unverified” below.

## Per-screenshot findings

| Screenshot | State check | Known visual / behavioral differences next to this screenshot |
| --- | --- | --- |
| `shell-1280-pair.png` | Matched: app home shell vs prototype home shell. | App has the fixed top research-demo banner; prototype starts at the nav. App nav/footer uses the real repo URL; prototype uses `[YOUR REPO LINK]`. |
| `shell-768-pair.png` | Matched: same shell at tablet width. | Same banner/footer differences. App hero starts lower because the banner consumes vertical space. |
| `shell-360-pair.png` | Matched: same shell at mobile width. | App banner wraps to multiple lines and pushes content down; prototype has no banner. App uses collapsed mobile toggle; prototype shows no equivalent links in the captured strip. |
| `home-1280-pair.png` | Matched: both Home, untrained. | App adds the spec’s `What this is not` section with five items; prototype has no such section. App footer uses the real repo URL. App is taller (about 1288px of content vs about 897px). |
| `home-768-pair.png` | Matched: both Home, untrained, tablet. | Same added section/footer differences; app taller (about 1806px vs about 1388px). |
| `home-360-pair.png` | Matched: both Home, untrained, mobile. | Same added section/footer differences; app taller (about 2714px vs about 2108px). No horizontal overflow was asserted by the Home specs. |
| `score-1280-pair.png` | Matched: both Score form, untrained sample state. | See `score-prototype-differences.md`: button colors, input borders, `Loan type` placeholder vs `Select a loan type`, mock option labels, shorter meta helper, native number spinners, CSS chevron, H2 vs H3 side headings, teal vs indigo bullet markers. Also: app top banner and real footer URL. Hover color is not visible in a static PNG. |
| `result-1280-pair.png` | Matched: both sample Result view. | See `result-prototype-differences.md`: sample banner shows only its label, thin-file sentence comes from `/meta`, button colors, H2 headings. Also: app top banner and real footer URL. |
| `batch-1280-default-pair.png` | Matched: both Batch view, approve 10% / reject 20%. | See `batch-prototype-differences.md`: slider range/step, data-derived counts and histogram, blank CSV template link, 50-row pagination vs 7 prototype rows, hidden file input, spec footnote. Also: app top banner and real footer URL. |
| `batch-1280-approve-5.5-pair.png` | **Not an exact numeric state match**: app approve cutoff is 5.5%; prototype’s coarser slider can only show 5.0%. This is the closest available prototype state, documented as expected. | Same batch differences as above, plus approve/review counts differ (app 352/528 vs prototype 314/566 at 5.0%). |
| `report-1280-pair.png` | Matched: both Report, untrained. | See `report-prototype-differences.md`: real thin-file definition, 360×240 chart with ticks/grid/hidden table, 20/28px H2 titles, 8px dots and row headers, API rowgroup headers. Also: app top banner and real footer URL. |
| `report-trained-1280-pair.png` | **Not state-matched**: the prototype has no trained `/report` state. This pair is a layout/formatting reference only, not equality evidence. | See `report-trained-1280-differences.md`: info evaluation note replaces the untrained warning, metrics replace dashes, three calibration series/ticks/legend replace the empty chart, API fairness dimensions/groups replace the three copy-defined dash rows. Existing spec differences still apply. Trained app content is taller (about 2027px vs prototype 1678px). |

## Trained report capture

- File: `report-trained-1280-app.png` and `report-trained-1280-pair.png`.
- App side: production build on `http://127.0.0.1:4173` with `page.route('**/api/report')` and `page.route('**/api/meta')`.
- Fixture shape: three performance groups (`thin`, `thick`, `all`) with all optional metrics populated; three calibration series with four points each; three fairness dimensions with 2–3 groups each; non-empty `evaluation_note`.
- OCR confirmed the rendered trained state: `1,842`, `0.712`, AUC interval, chart ticks/legend, and fairness groups such as `Female` and `Under 30`.
- No clipped visible table cells at 1280px; `document.scrollWidth` is 1280 at 1280px and 360 at 360px after the layout fix below.

## Layout fix made during verification

The hidden calibration data table originally used `sr-only` on the `<table>` itself. With trained data it expanded `document.scrollWidth` to 577px at a 360px viewport. It is now wrapped in an `sr-only` `<div>`, which clips the table without changing any copy, spec wording, or color. The new 360px overflow assertion passes.

## Payload edge cases that could still break layout with a live API

- Missing or non-array `groups` / `calibration` / `fairness`, or a group key outside `thin|thick|all`, fails schema parsing: the page shows a load error instead of report sections.
- Duplicate group keys: `groups.find()` uses the first match, so later duplicates are silently ignored.
- `inconclusive: true` renders all seven performance cells as the long `Inconclusive` text; repeated across rows this can wrap awkwardly and widen the table.
- Very large `n`, metric values, or AUC interval values can exceed the table’s 720px minimum width; the wrapper scrolls horizontally, but the desktop layout is not designed for unbounded strings.
- Reversed `auc_ci` values are displayed as-is; there is no low/high validation.
- Missing optional metrics display dashes safely, but a trained API returning an empty `fairness` array renders the untrained-style three dash rows, which could be misleading.
- Long `evaluation_note`, `dimension`, or fairness `label` strings have no truncation; they will wrap and increase page height.
- Duplicate calibration keys or fairness dimension/group labels cause React key collisions; duplicate series/rows may render incorrectly.
- Hundreds of calibration points or many fairness dimensions render without virtualization; the page becomes very tall and the polyline dense.
- `is_sample` is present in the report schema but has no visual effect; a live API setting it cannot be verified from the page.

## Still unverified

1. Direct human-eye visual inspection was impossible in this model, so anti-aliasing, exact spacing, icon alignment, color rendering, and subtle overlap cannot be confirmed. OCR/pixel/DOM evidence is strong but not a substitute for eyeballing.
2. Prototype fidelity depends on CDN-loaded Tailwind and fonts; offline/CSP differences could change the prototype side.
3. No trained prototype state exists, so the trained pair cannot be state-matched or used as pixel-equality evidence.
4. Windows OCR returned zero-valued line bounding boxes, so the “no OCR line outside half” check was not usable; overflow conclusions come from DOM assertions and dark-pixel edge analysis instead.
5. Only the mocked trained fixture was inspected. Real backend latency, partial failures, and live payload anomalies were not exercised.
6. Hover, focus, keyboard, and animation states are not visible in static pairs; only their static CSS/DOM was checked.
7. Lint is wired as `npm run lint` (TypeScript `tsc --noEmit`); there is no ESLint/Biome config in this repo.
