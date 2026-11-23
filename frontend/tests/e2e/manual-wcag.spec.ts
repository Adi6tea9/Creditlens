import { expect, test, type Page, type Route } from '@playwright/test';

import { getMeta as fixtureMeta, postBatch as fixtureBatch, postScore as fixtureScore } from '../../src/api/mock';
import { copy } from '../../src/content/copy';

// Axe is kept in home.spec.ts / report.spec.ts. These are explicit proxies for
// items axe cannot decide by itself: focus order, keyboard operation, custom
// chart contrast and reflow at a 200%-zoom-equivalent CSS width.
test.use({ baseURL: 'http://127.0.0.1:4173' });

async function answerMeta(route: Route) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(await fixtureMeta()),
  });
}

async function answerBatch(route: Route) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(await fixtureBatch()),
  });
}

/** Production mode has no batch until a file is uploaded; trigger the fixture. */
async function uploadFixtureCsv(page: Page) {
  const meta = await fixtureMeta();
  const header = meta.fields.map((field) => field.id).join(',');
  const row = meta.fields
    .map((field) => (field.type === 'select' ? 'cash' : '1'))
    .join(',');
  await page.locator('#applicant-file').setInputFiles({
    name: 'fixture.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(`${header}\n${row}\n`, 'utf8'),
  });
  await expect(page.getByText(copy.batch.applicantsScoredSample)).toBeVisible();
}

async function answerReport(route: Route) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      model_trained: true,
      is_sample: true,
      groups: [{ key: 'all', n: 300, default_rate: 0.12 }],
      calibration: [{ key: 'all', points: [{ pred: 0.2, obs: 0.25, n: 300 }] }],
      fairness: [],
    }),
  });
}

async function seedResult(page: Page) {
  const state = {
    ...(await fixtureScore()),
    thin_file_short: (await fixtureMeta()).thin_file_short,
  };
  await page.addInitScript((seed) => {
    window.history.replaceState({ usr: seed }, '');
  }, state);
}

function parseRgb(value: string): [number, number, number] {
  const parts = value.match(/\d+(?:\.\d+)?/gu);
  if (!parts || parts.length < 3) throw new Error(`Cannot parse colour: ${value}`);
  return [Number(parts[0]), Number(parts[1]), Number(parts[2])];
}

function luminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: [number, number, number], b: [number, number, number]): number {
  const l1 = luminance(a);
  const l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

const WHITE: [number, number, number] = [255, 255, 255];

test.describe('manual WCAG proxies (axe cannot verify these by itself)', () => {
  test('focus order follows the DOM: logo → nav → first form control', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.route('**/api/meta', answerMeta);
    await page.goto('/score');
    await expect(page.getByLabel('Loan type')).toBeVisible();

    const activeName = () =>
      page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        const label = el?.getAttribute('aria-label');
        const labels = (el as HTMLInputElement | null)?.labels;
        return (
          label ??
          labels?.[0]?.textContent?.trim() ??
          el?.textContent?.trim() ??
          el?.tagName ??
          ''
        );
      });

    // Spec 3 moves focus to the H1 on route change, so walk backwards through
    // the header first, then forwards to prove the normal tab sequence.
    expect(await activeName()).toBe(copy.score.h1);
    const backwards: string[] = [];
    for (let i = 0; i < 5; i += 1) {
      await page.keyboard.press('Shift+Tab');
      backwards.push(await activeName());
    }
    console.log(`[manual-wcag] header focus (Shift+Tab from H1): ${JSON.stringify(backwards)}`);
    expect(backwards).toEqual([
      copy.report.h1,
      copy.batch.h1,
      copy.score.h1,
      copy.nav.home,
      'CreditLens',
    ]);

    const forwards: string[] = [];
    for (let i = 0; i < 5; i += 1) {
      await page.keyboard.press('Tab');
      forwards.push(await activeName());
    }
    console.log(`[manual-wcag] header focus (Tab to form): ${JSON.stringify(forwards)}`);
    expect(forwards).toEqual([
      copy.nav.home,
      copy.score.h1,
      copy.batch.h1,
      copy.report.h1,
      'Loan type',
    ]);
  });

  test('keyboard operability: sliders, file input and nav links respond to keys', async ({ page }) => {
    await page.route('**/api/meta', answerMeta);
    await page.route('**/api/score/batch', answerBatch);
    await page.route('**/api/report', answerReport);

    await page.goto('/batch');
    await uploadFixtureCsv(page);

    const slider = page.locator('#approve-cutoff');
    await slider.focus();
    await expect(slider).toBeFocused();
    const beforeValue = Number(await slider.inputValue());
    const beforeWidth = await page
      .getByTestId('bar-approve')
      .evaluate((el) => (el as HTMLElement).style.width);
    await page.keyboard.press('ArrowRight');
    await expect(slider).toHaveValue(String(beforeValue + 0.5));
    await expect
      .poll(() =>
        page.getByTestId('bar-approve').evaluate((el) => (el as HTMLElement).style.width),
      )
      .not.toBe(beforeWidth);

    const fileInput = page.locator('#applicant-file');
    await fileInput.focus();
    await expect(fileInput).toBeFocused();

    const reportLink = page
      .getByRole('navigation', { name: copy.nav.primaryNav })
      .getByRole('link', { name: copy.report.h1 });
    await reportLink.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/report$/u);
  });

  test('custom chart contrast: review border and chart labels meet WCAG ratios', async ({ page }) => {
    await page.route('**/api/meta', answerMeta);
    await page.route('**/api/score/batch', answerBatch);
    await page.route('**/api/report', answerReport);

    await page.goto('/batch');
    await uploadFixtureCsv(page);

    // Widen the Review band so at least one amber-bordered bin is rendered.
    await page.locator('#approve-cutoff').focus();
    await page.keyboard.press('Home');
    await page.locator('#reject-cutoff').focus();
    await page.keyboard.press('End');

    const reviewBin = page.locator('[data-testid^="hist-bin-"].border-amber-600').first();
    await expect(reviewBin).toBeVisible();
    const review = await reviewBin.evaluate((el) => {
      const style = getComputedStyle(el);
      return { border: style.borderTopColor, background: style.backgroundColor };
    });
    const tickColor = await page
      .getByText('0%', { exact: true })
      .first()
      .evaluate((el) => getComputedStyle(el).color);
    const borderRatio = contrast(parseRgb(review.border), WHITE);
    const tickRatio = contrast(parseRgb(tickColor), WHITE);

    await page.goto('/report');
    await expect(page.getByRole('img', { name: copy.report.calibrationAria })).toBeVisible();
    const calibrationText = await page
      .locator('svg text')
      .first()
      .evaluate((el) => getComputedStyle(el).fill);
    const calibrationRatio = contrast(parseRgb(calibrationText), WHITE);

    console.log(
      `[manual-wcag] chart contrast: reviewBorder=${borderRatio.toFixed(2)}:1 histogramTick=${tickRatio.toFixed(2)}:1 calibrationText=${calibrationRatio.toFixed(2)}:1`,
    );
    expect(borderRatio).toBeGreaterThanOrEqual(3);
    expect(tickRatio).toBeGreaterThanOrEqual(4.5);
    expect(calibrationRatio).toBeGreaterThanOrEqual(4.5);
  });

  test('reflow/zoom: five routes have no horizontal scroll at 360px and 640px (200% of 1280)', async ({
    page,
  }) => {
    await page.route('**/api/meta', answerMeta);
    await page.route('**/api/report', answerReport);
    await seedResult(page);

    for (const width of [360, 640]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of ['/', '/score', '/score/result', '/batch', '/report']) {
        await page.goto(route);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        console.log(`[manual-wcag] reflow route=${route} width=${width} scrollWidth=${scrollWidth}`);
        expect(scrollWidth).toBeLessThanOrEqual(width);
      }
    }
  });
});
