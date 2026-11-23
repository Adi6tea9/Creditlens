import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { copy } from '../../src/content/copy';

const prototypeUrl = pathToFileURL(
  resolve(process.cwd(), '../docs/ui/creditlens_credit_risk_research_demo.html'),
).href;

const SHOTS = 'tests/e2e/__screenshots__';

async function setRange(page: Page, selector: string, value: string) {
  await page.locator(selector).evaluate((input, next) => {
    const el = input as HTMLInputElement;
    // React tracks value changes; use the native setter so onChange fires.
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    setter.call(el, next);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

async function screenshotPair(page: Page, name: string) {
  const appPath = `${SHOTS}/batch-1280-${name}-app.png`;
  const prototypePath = `${SHOTS}/batch-1280-${name}-prototype.png`;
  await page.screenshot({ path: appPath, fullPage: true });

  await page.goto(prototypeUrl, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    (window as unknown as { switchView: (view: string) => void }).switchView('batch');
  });
  if (name === 'approve-5.5') await setRange(page, '#approve-slider', '5');
  await page.waitForTimeout(350);
  await page.screenshot({ path: prototypePath, fullPage: true });

  const appB64 = readFileSync(appPath).toString('base64');
  const prototypeB64 = readFileSync(prototypePath).toString('base64');
  await page.setViewportSize({ width: 2560, height: 900 });
  await page.setContent(`<!doctype html><html><body style="margin:0;background:#fff;font:12px sans-serif">
    <div style="display:flex;height:24px"><div style="width:1280px;padding:4px 8px;box-sizing:border-box">App (CreditLens Batch)</div><div style="width:1280px;padding:4px 8px;box-sizing:border-box;border-left:1px solid #ccc">Prototype (spec visual source of truth)</div></div>
    <div style="display:flex;align-items:flex-start"><img width="1280" src="data:image/png;base64,${appB64}" alt="app"><img width="1280" src="data:image/png;base64,${prototypeB64}" alt="prototype"></div>
  </body></html>`);
  await page.screenshot({ path: `${SHOTS}/batch-1280-${name}-pair.png`, fullPage: true });
  await page.setViewportSize({ width: 1280, height: 900 });
}

test.describe('Batch (spec 6.4)', () => {
  test.describe('screenshot evidence (mock-mode build)', () => {
    test.use({ baseURL: 'http://127.0.0.1:4174' });

    test('screenshot evidence: Batch at 1280px beside the prototype, default and approve 5.5', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto('/batch');
      await expect(page.getByRole('heading', { level: 1, name: copy.batch.h1 })).toBeVisible();
      await expect(page.getByText(copy.batch.applicantsScoredSample)).toBeVisible();
      await expect(page.getByText('624')).toBeVisible();
      await page.waitForTimeout(350);
      await screenshotPair(page, 'default');

      await page.goto('/batch');
      await expect(page.getByText(copy.batch.applicantsScoredSample)).toBeVisible();
      await setRange(page, '#approve-cutoff', '5.5');
      await expect(page.getByText('352', { exact: true }).first()).toBeVisible();
      expect(
        await page.getByTestId('hist-approve-line').evaluate((el) => (el as HTMLElement).style.left),
      ).toBe('13.75%');
      await page.waitForTimeout(350);
      await screenshotPair(page, 'approve-5.5');

      writeFileSync(
        `${SHOTS}/batch-prototype-differences.md`,
        `# Batch screenshot vs prototype — known differences\n\n` +
          `Comparison: \`batch-1280-default-pair.png\` and \`batch-1280-approve-5.5-pair.png\` (left = app, right = prototype).\n` +
          `Prototype source: \`docs/ui/creditlens_credit_risk_research_demo.html\`, Batch view.\n` +
          `App side is built with \`npm run build:mock\`.\n\n` +
          `Expected differences (not bugs):\n\n` +
          `1. The approve slider is 1–30 step 0.5 as specified; the prototype is 2.5–35 step 2.5. The 5.5 pair therefore uses the closest prototype setting, 5.0%.\n` +
          `2. App counts, bar and histogram come from the same 1,000 ranked rows; the prototype bins are pre-aggregated, so individual bar heights can differ slightly.\n` +
          `3. The app adds the blank CSV template link built from \`/meta.fields\` (spec addition 14); the prototype has no template link.\n` +
          `4. The app paginates the full ranked list 50 rows at a time with \`Showing a–b of n\`; the prototype shows 7 illustrative rows with no pagination.\n` +
          `5. The app file input is visually hidden with \`sr-only\` and a visible focus ring; the prototype uses \`class="hidden"\`.\n` +
          `6. The app footnote follows spec 7.6 verbatim, including the "Showing 7 sample rows..." sentence even though the table paginates all 1,000 mock rows.\n\n` +
          `Anything else in the pairs should be treated as a real visual gap.\n`,
      );
    });

    test('file chooser opens from the keyboard and shows the chosen file', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto('/batch');
      const input = page.getByLabel(copy.batch.chooseFile);
      await input.focus();
      await expect(input).toBeFocused();

      const chooserPromise = page.waitForEvent('filechooser');
      await page.keyboard.press('Enter');
      const chooser = await chooserPromise;
      await chooser.setFiles({
        name: 'applicants.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from('loan_type\n'),
      });

      await expect(page.getByText('applicants.csv')).toBeVisible();
      await expect(page.getByText(copy.batch.applicantsScoredSample)).toBeVisible();
    });
  });

  test('axe: no violations on the rendered /batch', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/batch');
    await expect(page.getByRole('heading', { level: 1, name: copy.batch.h1 })).toBeVisible();
    await expect(page.getByText(copy.batch.emptyState)).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    writeFileSync(`${SHOTS}/axe-batch-1280.json`, JSON.stringify(results.violations, null, 2));
    expect(results.violations).toEqual([]);
  });
});
