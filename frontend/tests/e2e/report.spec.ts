import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { getMeta as mockGetMeta } from '../../src/api/mock';
import type { Report } from '../../src/api/schemas';
import { copy } from '../../src/content/copy';

const prototypeUrl = pathToFileURL(
  resolve(process.cwd(), '../docs/ui/creditlens_credit_risk_research_demo.html'),
).href;

const SHOTS = 'tests/e2e/__screenshots__';

const trainedReport: Report = {
  model_trained: true,
  is_sample: false,
  evaluation_note: 'Held-out evaluation complete. Figures below come from the evaluation set.',
  groups: [
    {
      key: 'thin',
      n: 1842,
      default_rate: 0.142,
      roc_auc: 0.712,
      pr_auc: 0.391,
      ks: 0.286,
      calibration_error: 0.031,
      auc_ci: [0.681, 0.743],
    },
    {
      key: 'thick',
      n: 8158,
      default_rate: 0.091,
      roc_auc: 0.748,
      pr_auc: 0.422,
      ks: 0.318,
      calibration_error: 0.018,
      auc_ci: [0.733, 0.763],
    },
    {
      key: 'all',
      n: 10000,
      default_rate: 0.1,
      roc_auc: 0.741,
      pr_auc: 0.415,
      ks: 0.309,
      calibration_error: 0.021,
      auc_ci: [0.728, 0.754],
    },
  ],
  calibration: [
    {
      key: 'thin',
      points: [
        { pred: 0.05, obs: 0.07, n: 220 },
        { pred: 0.1, obs: 0.13, n: 410 },
        { pred: 0.2, obs: 0.23, n: 620 },
        { pred: 0.3, obs: 0.34, n: 320 },
      ],
    },
    {
      key: 'thick',
      points: [
        { pred: 0.05, obs: 0.06, n: 980 },
        { pred: 0.1, obs: 0.11, n: 2100 },
        { pred: 0.2, obs: 0.19, n: 2600 },
        { pred: 0.3, obs: 0.31, n: 1400 },
      ],
    },
    {
      key: 'all',
      points: [
        { pred: 0.05, obs: 0.06, n: 1200 },
        { pred: 0.1, obs: 0.12, n: 2510 },
        { pred: 0.2, obs: 0.21, n: 3220 },
        { pred: 0.3, obs: 0.32, n: 1720 },
      ],
    },
  ],
  fairness: [
    {
      dimension: 'By gender',
      groups: [
        { label: 'Female', error_rate: 0.112, calibration_gap: 0.023 },
        { label: 'Male', error_rate: 0.094, calibration_gap: 0.018 },
      ],
    },
    {
      dimension: 'By age band',
      groups: [
        { label: 'Under 30', error_rate: 0.131, calibration_gap: 0.029 },
        { label: '30–49', error_rate: 0.098, calibration_gap: 0.017 },
        { label: '50+', error_rate: 0.087, calibration_gap: 0.014 },
      ],
    },
    {
      dimension: 'Thin vs thick file',
      groups: [
        { label: 'Thin-file', error_rate: 0.148, calibration_gap: 0.034 },
        { label: 'Thick-file', error_rate: 0.089, calibration_gap: 0.015 },
      ],
    },
  ],
};

async function mockTrainedApi(page: Page): Promise<void> {
  await page.route('**/api/meta', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(await mockGetMeta()),
    });
  });
  await page.route('**/api/report', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(trainedReport),
    });
  });
}

test.describe('Report (spec 6.5)', () => {
  test.use({ baseURL: 'http://127.0.0.1:4174' });

  test.describe('screenshot evidence (mock-mode build)', () => {
    test('screenshot evidence: Report at 1280px beside the prototype', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto('/report');
      await expect(page.getByRole('heading', { level: 1, name: copy.report.h1 })).toBeVisible();
      await expect(page.getByText('No model has been trained yet.')).toBeVisible();
      await expect(
        page
          .getByRole('img', { name: copy.report.calibrationEmptyAria })
          .getByText(copy.report.calibrationEmpty),
      ).toBeVisible();
      await page.waitForTimeout(350);

      const appPath = `${SHOTS}/report-1280-app.png`;
      const prototypePath = `${SHOTS}/report-1280-prototype.png`;
      await page.screenshot({ path: appPath, fullPage: true });

      await page.goto(prototypeUrl, { waitUntil: 'networkidle' });
      await page.evaluate(() => {
        (window as unknown as { switchView: (view: string) => void }).switchView('report');
      });
      await page.waitForTimeout(350);
      await page.screenshot({ path: prototypePath, fullPage: true });

      const appB64 = readFileSync(appPath).toString('base64');
      const prototypeB64 = readFileSync(prototypePath).toString('base64');
      await page.setViewportSize({ width: 2560, height: 900 });
      await page.setContent(`<!doctype html><html><body style="margin:0;background:#fff;font:12px sans-serif">
        <div style="display:flex;height:24px"><div style="width:1280px;padding:4px 8px;box-sizing:border-box">App (CreditLens Report)</div><div style="width:1280px;padding:4px 8px;box-sizing:border-box;border-left:1px solid #ccc">Prototype (spec visual source of truth)</div></div>
        <div style="display:flex;align-items:flex-start"><img width="1280" src="data:image/png;base64,${appB64}" alt="app"><img width="1280" src="data:image/png;base64,${prototypeB64}" alt="prototype"></div>
      </body></html>`);
      await page.screenshot({ path: `${SHOTS}/report-1280-pair.png`, fullPage: true });

      writeFileSync(
        `${SHOTS}/report-prototype-differences.md`,
        `# Report screenshot vs prototype — known differences\n\n` +
          `Comparison: \`report-1280-pair.png\` (left = app, right = prototype).\n` +
          `Prototype source: \`docs/ui/creditlens_credit_risk_research_demo.html\`, Report view.\n` +
          `App side is built with \`npm run build:mock\`.\n\n` +
          `Expected differences (not bugs):\n\n` +
          `1. The app fills the thin-file rule from \`/meta.thin_file_definition\`; the prototype shows a bracketed definition placeholder.\n` +
          `2. The app chart uses the specified 360×240 viewBox with three ticks, grid lines and a hidden data table; the prototype uses a shorter 360×230 viewBox with four grid lines and no ticks or table.\n` +
          `3. The app card titles for performance, evaluation and limits follow the spec’s 20/28px H2 style; the prototype uses 16px headings.\n` +
          `4. The app draws 8px dots with semantic ink/primary/amber tokens and a row header per applicant group; the prototype uses plain table cells with flex.\n` +
          `5. The app fairness table uses rowgroup headers for API dimensions; the empty mock state still shows the three copy-defined section rows with dashes.\n\n` +
          `Anything else in the pair should be treated as a real visual gap.\n`,
      );
    });
  });

  test.describe('trained report screenshot evidence (production build + mocked API)', () => {
    test.use({ baseURL: 'http://127.0.0.1:4173' });

    test('trained report at 1280px beside untrained prototype reference', async ({ page }) => {
      await mockTrainedApi(page);
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto('/report');
      await expect(page.getByRole('heading', { level: 1, name: copy.report.h1 })).toBeVisible();
      await expect(page.getByText('No model has been trained yet.')).toHaveCount(0);
      await expect(page.getByText(trainedReport.evaluation_note ?? '')).toBeVisible();
      await expect(page.locator('[data-series]')).toHaveCount(3);
      await expect(page.locator('th[scope="rowgroup"]')).toHaveCount(3);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        1280,
      );
      const clipped = await page.locator('td, th').evaluateAll((elements) =>
        elements
          .filter(
            (element) =>
              !(element as HTMLElement).closest('.sr-only') &&
              (element as HTMLElement).offsetParent !== null &&
              element.scrollWidth > element.clientWidth + 1,
          )
          .map((element) => `${element.tagName}: ${element.textContent?.trim() ?? ''}`),
      );
      expect(clipped).toEqual([]);
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
      await page.waitForTimeout(350);

      const appPath = `${SHOTS}/report-trained-1280-app.png`;
      const prototypePath = `${SHOTS}/report-1280-prototype.png`;
      await page.screenshot({ path: appPath, fullPage: true });

      await page.goto(prototypeUrl, { waitUntil: 'networkidle' });
      await page.evaluate(() => {
        (window as unknown as { switchView: (view: string) => void }).switchView('report');
      });
      await page.waitForTimeout(350);
      await page.screenshot({ path: prototypePath, fullPage: true });

      const appB64 = readFileSync(appPath).toString('base64');
      const prototypeB64 = readFileSync(prototypePath).toString('base64');
      await page.setViewportSize({ width: 2560, height: 900 });
      await page.setContent(`<!doctype html><html><body style="margin:0;background:#fff;font:12px sans-serif">
        <div style="display:flex;height:24px"><div style="width:1280px;padding:4px 8px;box-sizing:border-box">App (trained /report, mocked API)</div><div style="width:1280px;padding:4px 8px;box-sizing:border-box;border-left:1px solid #ccc">Prototype (untrained reference only; no trained state exists)</div></div>
        <div style="display:flex;align-items:flex-start"><img width="1280" src="data:image/png;base64,${appB64}" alt="app"><img width="1280" src="data:image/png;base64,${prototypeB64}" alt="prototype"></div>
      </body></html>`);
      await page.screenshot({ path: `${SHOTS}/report-trained-1280-pair.png`, fullPage: true });

      writeFileSync(
        `${SHOTS}/report-trained-1280-differences.md`,
        `# Trained report screenshot vs prototype — known differences\n\n` +
          `Comparison: \`report-trained-1280-pair.png\` (left = app with mocked trained \`/api/report\`, right = prototype Report view).\n` +
          `State match: **not state-matched**. The prototype has only the untrained state, so this pair is a layout/formatting reference, not equality evidence.\n` +
          `App side: production build \`npm run build\` with \`page.route\` mocks for \`/api/report\` and \`/api/meta\`.\n` +
          `Mock shape: 3 performance groups (thin/thick/all), 3 calibration series with 4 points each, and 3 fairness dimensions with 2–3 groups each.\n\n` +
          `Expected differences (not bugs):\n\n` +
          `1. The untrained warning banner is replaced by the info evaluation note supplied by \`/api/report\`; the prototype has no trained banner state.\n` +
          `2. Performance cells show counts, rates, metrics and AUC intervals instead of dashes.\n` +
          `3. Calibration shows three series, three ticks/grid lines and a legend instead of “Chart appears after evaluation”.\n` +
          `4. Fairness shows API dimension rowgroups and group labels with values instead of the three copy-defined section rows with dashes.\n` +
          `5. Existing spec differences still apply: 20/28px H2 titles, 8px dots and row headers, real thin-file definition and real repo URL.\n\n` +
          `Layout checks: no document horizontal overflow at 1280px or 360px, no clipped visible table cells at 1280px, three calibration series and three fairness rowgroups rendered.\n`,
      );
    });

    test('trained report has no horizontal overflow at 360px', async ({ page }) => {
      await mockTrainedApi(page);
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto('/report');
      await expect(page.getByText(trainedReport.evaluation_note ?? '')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        360,
      );
    });
  });

  test('axe: no violations on the rendered /report', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/report');
    await expect(page.getByText('No model has been trained yet.')).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    writeFileSync(`${SHOTS}/axe-report-1280.json`, JSON.stringify(results.violations, null, 2));
    expect(results.violations).toEqual([]);
  });
});
