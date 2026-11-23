# Manual WCAG checks (axe cannot decide these alone)

Automated axe coverage remains in `tests/e2e/home.spec.ts` and
`tests/e2e/report.spec.ts`. The checks below cover items that need a human
decision or a browser-level proxy.

| Item | Automated proxy | Human sign-off still required |
|---|---|---|
| Focus order | `tests/e2e/manual-wcag.spec.ts` records Tab order on `/score` and asserts logo → primary nav → first form control. | Confirm the order feels logical in each route and with the mobile menu open. |
| Keyboard operability | Same spec drives the batch slider with ArrowRight, focuses the visually hidden file input, and activates a nav link with Enter. | Confirm every custom control is reachable and usable without a mouse, including the mobile menu and retry buttons. |
| Custom/chart contrast | Same spec computes contrast ratios from computed styles for the Review histogram border, histogram tick labels, and calibration SVG text. The first run exposed a missing Tailwind amber shade scale; `tailwind.config.ts` now keeps the full prototype scale with `DEFAULT: #D97706`, so no hex value changed. | Confirm the rendered chart colours visually, especially at different display settings and against the real report payload. |
| Reflow / zoom | Same spec checks all five routes at 360 px and 640 px CSS width (640 px is 1280 px at 200% zoom) and asserts no horizontal scroll. | Confirm 200% browser zoom, text-only zoom, and 400% zoom manually on target devices. |
| 11px text audit | `tests/unit/eleven-px-audit.test.ts` allows 11px only in chart tick/title code (`Histogram.tsx`, `CalibrationChart.tsx`) and requires the Result eyebrow to use `text-xs` (spec §4.5). | Confirm chart labels remain legible; the prototype's four 11px occurrences are intentionally unchanged. |

A1 and A2 remain owner-approved deviations: the app uses `#0F766E` primary
buttons and `#64748B` input borders; the prototype keeps `#0D9488` and
`#CBD5E1`. No colour was changed by these checks.

Run the proxies with:

```sh
npx vitest run tests/unit/eleven-px-audit.test.ts
npx playwright test tests/e2e/manual-wcag.spec.ts
```
