import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { getMeta as mockGetMeta, postScore as mockPostScore } from '../../src/api/mock';
import { copy } from '../../src/content/copy';

const prototypeUrl = pathToFileURL(
  resolve(process.cwd(), '../docs/ui/creditlens_credit_risk_research_demo.html'),
).href;

async function seedResult(page: Page) {
  const state = {
    ...(await mockPostScore()),
    thin_file_short: (await mockGetMeta()).thin_file_short,
  };
  await page.addInitScript((seed) => {
    window.history.replaceState({ usr: seed }, '');
  }, state);
}

test.describe('Result (spec 6.3)', () => {
  test.describe('screenshot evidence (mock-mode build)', () => {
    test.use({ baseURL: 'http://127.0.0.1:4174' });

    test('screenshot evidence: Result at 1280px beside the prototype', async ({ page }) => {
      await seedResult(page);
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto('/score/result');
      await expect(page.getByText(`${copy.result.sampleBannerLabel}.`)).toBeVisible();
      await expect(page.getByText('Sample range for this applicant: 10% to 19%')).toBeVisible();
      await page.waitForTimeout(350); // let fadeSlideIn finish
      const appPath = 'tests/e2e/__screenshots__/result-1280-app-full.png';
      const prototypePath = 'tests/e2e/__screenshots__/result-1280-prototype-full.png';
      await page.screenshot({ path: appPath, fullPage: true });

      await page.goto(prototypeUrl, { waitUntil: 'networkidle' });
      await page.evaluate(() => {
        (window as unknown as { switchView: (view: string) => void }).switchView('result');
      });
      await page.waitForTimeout(350);
      await page.screenshot({ path: prototypePath, fullPage: true });

      const appB64 = readFileSync(appPath).toString('base64');
      const prototypeB64 = readFileSync(prototypePath).toString('base64');
      await page.setViewportSize({ width: 2560, height: 900 });
      await page.setContent(`<!doctype html><html><body style="margin:0;background:#fff;font:12px sans-serif">
        <div style="display:flex;height:24px"><div style="width:1280px;padding:4px 8px;box-sizing:border-box">App (CreditLens Result)</div><div style="width:1280px;padding:4px 8px;box-sizing:border-box;border-left:1px solid #ccc">Prototype (spec visual source of truth)</div></div>
        <div style="display:flex;align-items:flex-start"><img width="1280" src="data:image/png;base64,${appB64}" alt="app"><img width="1280" src="data:image/png;base64,${prototypeB64}" alt="prototype"></div>
      </body></html>`);
      await page.screenshot({ path: 'tests/e2e/__screenshots__/result-1280-pair.png', fullPage: true });

      writeFileSync(
        'tests/e2e/__screenshots__/result-prototype-differences.md',
        `# Result screenshot vs prototype — known differences\n\n` +
          `Comparison: \`result-1280-pair.png\` (left = app, right = prototype).\n` +
          `Prototype source: \`docs/ui/creditlens_credit_risk_research_demo.html\`, Result view.\n` +
          `App side is built with \`npm run build:mock\`.\n\n` +
          `Expected differences (not bugs):\n\n` +
          `1. The sample banner shows only the \`Sample output\` label (owner ruling: keep copy.ts unchanged); the prototype adds a full explanatory sentence.\n` +
          `2. Thin-file text comes from spec 7.5 with \`thin_file_short\` from /meta; the prototype uses a shorter bespoke sentence.\n` +
          `3. Primary button base is teal-700 \`#0F766E\` with teal-800 hover (spec A1); the prototype uses teal-600.\n` +
          `4. Card headings are H2; the prototype uses a mix of H2/H3 with the same visible text and size.\n\n` +
          `Anything else in the pair should be treated as a real visual gap.\n`,
      );
    });
  });

  test('axe: no violations on the rendered /score/result', async ({ page }) => {
    await seedResult(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/score/result');
    await expect(page.getByRole('heading', { level: 1, name: 'Result' })).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    writeFileSync(
      'tests/e2e/__screenshots__/axe-score-result-1280.json',
      JSON.stringify(results.violations, null, 2),
    );
    expect(results.violations).toEqual([]);
  });
});
