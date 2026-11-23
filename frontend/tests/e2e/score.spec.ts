import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { getMeta as mockGetMeta, postScore as mockPostScore } from '../../src/api/mock';

const prototypeUrl = pathToFileURL(
  resolve(process.cwd(), '../docs/ui/creditlens_credit_risk_research_demo.html'),
).href;

test.describe('Score form (spec 6.2)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/meta', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(await mockGetMeta()),
      });
    });
  });

  test('screenshot evidence: Score at 1280px beside the prototype', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/score');
    await expect(page.getByLabel('Loan type')).toBeVisible();
    await page.waitForTimeout(350); // let fadeSlideIn finish
    const appPath = 'tests/e2e/__screenshots__/score-1280-app-full.png';
    const prototypePath = 'tests/e2e/__screenshots__/score-1280-prototype-full.png';
    await page.screenshot({ path: appPath, fullPage: true });

    await page.goto(prototypeUrl, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      (window as unknown as { switchView: (view: string) => void }).switchView('score');
    });
    await page.waitForTimeout(350);
    await page.screenshot({ path: prototypePath, fullPage: true });

    const appB64 = readFileSync(appPath).toString('base64');
    const prototypeB64 = readFileSync(prototypePath).toString('base64');
    await page.setViewportSize({ width: 2560, height: 900 });
    await page.setContent(`<!doctype html><html><body style="margin:0;background:#fff;font:12px sans-serif">
      <div style="display:flex;height:24px"><div style="width:1280px;padding:4px 8px;box-sizing:border-box">App (CreditLens Score)</div><div style="width:1280px;padding:4px 8px;box-sizing:border-box;border-left:1px solid #ccc">Prototype (spec visual source of truth)</div></div>
      <div style="display:flex;align-items:flex-start"><img width="1280" src="data:image/png;base64,${appB64}" alt="app"><img width="1280" src="data:image/png;base64,${prototypeB64}" alt="prototype"></div>
    </body></html>`);
    await page.screenshot({
      path: 'tests/e2e/__screenshots__/score-1280-pair.png',
      fullPage: true,
    });
  });

  test('axe: no violations on the rendered /score form', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/score');
    await expect(page.getByLabel('Loan type')).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    writeFileSync(
      'tests/e2e/__screenshots__/axe-score-form-1280.json',
      JSON.stringify(results.violations, null, 2),
    );
    expect(results.violations).toEqual([]);
  });

  test('submit posts the values and opens the result route', async ({ page }) => {
    await page.route('**/api/score', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(await mockPostScore()),
      });
    });
    await page.goto('/score');
    const meta = await mockGetMeta();
    for (const field of meta.fields) {
      if (field.type === 'select') {
        await page.getByLabel(field.label).selectOption('cash');
      } else {
        await page.getByLabel(field.label).fill('10');
      }
    }

    await page.getByRole('button', { name: 'Estimate risk' }).click();
    await expect(page).toHaveURL(/\/score\/result$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Result');
  });
});
