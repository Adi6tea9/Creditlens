# Trained report screenshot vs prototype — known differences

Comparison: `report-trained-1280-pair.png` (left = app with mocked trained `/api/report`, right = prototype Report view).
State match: **not state-matched**. The prototype has only the untrained state, so this pair is a layout/formatting reference, not equality evidence.
App side: production build `npm run build` with `page.route` mocks for `/api/report` and `/api/meta`.
Mock shape: 3 performance groups (thin/thick/all), 3 calibration series with 4 points each, and 3 fairness dimensions with 2–3 groups each.

Expected differences (not bugs):

1. The untrained warning banner is replaced by the info evaluation note supplied by `/api/report`; the prototype has no trained banner state.
2. Performance cells show counts, rates, metrics and AUC intervals instead of dashes.
3. Calibration shows three series, three ticks/grid lines and a legend instead of “Chart appears after evaluation”.
4. Fairness shows API dimension rowgroups and group labels with values instead of the three copy-defined section rows with dashes.
5. Existing spec differences still apply: 20/28px H2 titles, 8px dots and row headers, real thin-file definition and real repo URL.

Layout checks: no document horizontal overflow at 1280px or 360px, no clipped visible table cells at 1280px, three calibration series and three fairness rowgroups rendered.
