import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Prototype is the repo's visual source of truth (spec authority 1). It loads
// Tailwind/fonts from CDNs, so fidelity needs network access.
const prototypeUrl = pathToFileURL(
  resolve(process.cwd(), '../docs/ui/creditlens_credit_risk_research_demo.html'),
).href;

test.describe('Home layout (spec 6.1)', () => {
  test('hero is 7/5 at lg and stacks below lg', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    const hero = page.locator('main .grid').first();
    const columns = await hero.evaluate((el) => getComputedStyle(el).gridTemplateColumns);
    expect(columns.trim().split(/\s+/u)).toHaveLength(12);
    await expect(hero.locator(':scope > div').first()).toHaveCSS('grid-column-end', 'span 7');
    await expect(hero.locator(':scope > div').nth(1)).toHaveCSS('grid-column-end', 'span 5');

    for (const width of [768, 360]) {
      await page.setViewportSize({ width, height: 900 });
      await page.reload();
      const stacked = await hero.evaluate((el) => getComputedStyle(el).gridTemplateColumns);
      expect(stacked.trim().split(/\s+/u)).toHaveLength(1);
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(width);
    }
  });

  test('no horizontal scroll at 360px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 900 });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  });
});

test.describe('screenshot evidence: Home vs prototype', () => {
  for (const width of [360, 768, 1280]) {
    test(`Home at ${width}px beside the prototype`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await page.waitForTimeout(350); // let fadeSlideIn finish
      const appPath = `tests/e2e/__screenshots__/home-${width}-app-full.png`;
      const prototypePath = `tests/e2e/__screenshots__/home-${width}-prototype-full.png`;
      await page.screenshot({ path: appPath, fullPage: true });

      await page.goto(prototypeUrl, { waitUntil: 'networkidle' });
      await page.waitForTimeout(350);
      await page.screenshot({ path: prototypePath, fullPage: true });

      // Side-by-side evidence: left = app, right = prototype, same viewport width.
      const appB64 = readFileSync(appPath).toString('base64');
      const prototypeB64 = readFileSync(prototypePath).toString('base64');
      await page.setViewportSize({ width: width * 2, height: 900 });
      await page.setContent(`<!doctype html><html><body style="margin:0;background:#fff;font:12px sans-serif">
        <div style="display:flex;height:24px"><div style="width:${width}px;padding:4px 8px;box-sizing:border-box">App (CreditLens Home)</div><div style="width:${width}px;padding:4px 8px;box-sizing:border-box;border-left:1px solid #ccc">Prototype (spec visual source of truth)</div></div>
        <div style="display:flex;align-items:flex-start"><img width="${width}" src="data:image/png;base64,${appB64}" alt="app"><img width="${width}" src="data:image/png;base64,${prototypeB64}" alt="prototype"></div>
      </body></html>`);
      await page.screenshot({
        path: `tests/e2e/__screenshots__/home-${width}-pair.png`,
        fullPage: true,
      });
    });
  }
});

test('axe: no violations on /', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  writeFileSync(
    'tests/e2e/__screenshots__/home-axe-1280.json',
    JSON.stringify(results.violations, null, 2),
  );
  expect(results.violations).toEqual([]);
});

test('axe: no violations on /score', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/score');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  writeFileSync(
    'tests/e2e/__screenshots__/score-axe-1280.json',
    JSON.stringify(results.violations, null, 2),
  );
  expect(results.violations).toEqual([]);
});
