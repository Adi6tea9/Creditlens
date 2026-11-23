import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { copy } from '../../src/content/copy';

const prototypeUrl = pathToFileURL(
  resolve(process.cwd(), '../docs/ui/creditlens_credit_risk_research_demo.html'),
).href;

const SHOTS = 'tests/e2e/__screenshots__';

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

  test('axe: no violations on the rendered /report', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/report');
    await expect(page.getByText('No model has been trained yet.')).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    writeFileSync(`${SHOTS}/axe-report-1280.json`, JSON.stringify(results.violations, null, 2));
    expect(results.violations).toEqual([]);
  });
});
