import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { expect, test } from '@playwright/test';

const BANNER =
  'Research demo. Not a lending decision. Nothing here is a real score or a real applicant.';

// Prototype copied into the repo (visual source of truth, spec authority 1).
// It loads Tailwind + fonts from CDNs, so fidelity needs network access.
const prototypeUrl = pathToFileURL(
  resolve(process.cwd(), '../docs/ui/creditlens_credit_risk_research_demo.html'),
).href;

test.describe('shell behaviour', () => {
  test('banner is present on every route', async ({ page }) => {
    for (const route of ['/', '/score', '/batch', '/report', '/no-such-page']) {
      await page.goto(route);
      await expect(page.getByRole('note').first()).toHaveText(BANNER);
    }
  });

  test('result guard: direct visit and reload land on /score', async ({ page }) => {
    await page.goto('/score/result');
    await expect(page).toHaveURL(/\/score$/);
    await page.reload();
    await expect(page).toHaveURL(/\/score$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Score an applicant');
  });

  test('desktop nav items are links with hrefs', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Primary Navigation' });
    const expected: Array<[string, string]> = [
      ['Home', '/'],
      ['Score an applicant', '/score'],
      ['Batch scoring', '/batch'],
      ['Model report', '/report'],
    ];
    for (const [label, href] of expected) {
      await expect(nav.getByRole('link', { name: label })).toHaveAttribute('href', href);
    }
  });

  test('back button and refresh keep the page', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    await page
      .getByRole('navigation', { name: 'Primary Navigation' })
      .getByRole('link', { name: 'Score an applicant' })
      .click();
    await expect(page).toHaveURL(/\/score$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Does a credit model work',
    );

    await page.goto('/batch');
    await page.reload();
    await expect(page).toHaveURL(/\/batch$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Batch scoring');
  });

  test('mobile menu opens, navigates and closes at 360px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Toggle menu' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const menu = page.locator('#mobile-menu');
    await expect(menu).toBeVisible();
    await menu.getByRole('link', { name: 'Batch scoring' }).click();
    await expect(page).toHaveURL(/\/batch$/);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(menu).toBeHidden();
  });
});

test.describe('screenshot evidence: app shell vs prototype', () => {
  for (const width of [360, 768, 1280]) {
    test(`shell at ${width}px beside the prototype`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
      // Let fadeSlideIn (0.22s) finish before capturing.
      await page.waitForTimeout(350);
      const clip = { x: 0, y: 0, width, height: 240 };
      const appPath = `tests/e2e/__screenshots__/shell-${width}-app.png`;
      const prototypePath = `tests/e2e/__screenshots__/shell-${width}-prototype.png`;
      await page.screenshot({ path: appPath, clip });
      await page.screenshot({
        path: `tests/e2e/__screenshots__/shell-${width}-app-full.png`,
        fullPage: true,
      });
      await page.goto(prototypeUrl, { waitUntil: 'networkidle' });
      await page.waitForTimeout(350);
      await page.screenshot({ path: prototypePath, clip });

      // Side-by-side evidence: left = app shell, right = prototype, same clip.
      const appB64 = readFileSync(appPath).toString('base64');
      const prototypeB64 = readFileSync(prototypePath).toString('base64');
      await page.setViewportSize({ width: width * 2, height: 900 });
      await page.setContent(`<!doctype html><html><body style="margin:0;background:#fff;font:12px sans-serif">
        <div style="display:flex;height:24px"><div style="width:${width}px;padding:4px 8px;box-sizing:border-box">App shell (CreditLens implementation)</div><div style="width:${width}px;padding:4px 8px;box-sizing:border-box;border-left:1px solid #ccc">Prototype (spec visual source of truth)</div></div>
        <div style="display:flex"><img width="${width}" src="data:image/png;base64,${appB64}" alt="app"><img width="${width}" src="data:image/png;base64,${prototypeB64}" alt="prototype"></div>
      </body></html>`);
      await page.screenshot({
        path: `tests/e2e/__screenshots__/shell-${width}-pair.png`,
        clip: { x: 0, y: 0, width: width * 2, height: 264 },
      });
    });
  }
});
