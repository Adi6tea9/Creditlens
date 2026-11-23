import { expect, test } from '@playwright/test';

import {
  getMeta as mockGetMeta,
  getReport as mockGetReport,
  postBatch as mockPostBatch,
} from '../../src/api/mock';
import { copy } from '../../src/content/copy';

// The production build has no backend, so routed failures exercise the real
// API error paths (mock mode would answer locally and never hit the network).
test.use({ baseURL: 'http://127.0.0.1:4173' });

const SHOTS = 'tests/e2e/__screenshots__';

function offline(route: import('@playwright/test').Route) {
  return route.fulfill({
    status: 503,
    contentType: 'application/json',
    body: JSON.stringify({ detail: 'offline' }),
  });
}

async function answerMeta(route: import('@playwright/test').Route) {
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(await mockGetMeta()),
  });
}

test.describe('API failure states', () => {
  test('report skeleton: busy card shapes while /report is pending', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    let releaseReport: () => void = () => {};
    const pending = new Promise<void>((resolve) => {
      releaseReport = resolve;
    });
    await page.route('**/api/meta', answerMeta);
    await page.route('**/api/report', async (route) => {
      await pending;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(await mockGetReport()),
      });
    });

    await page.goto('/report');
    try {
      await expect(page.getByRole('status', { name: copy.states.loading })).toHaveCount(3);
      await expect(page.getByRole('heading', { name: copy.report.performanceTitle })).toHaveCount(0);
      expect(await page.locator('main').innerText()).not.toMatch(/\d/);
      await page.screenshot({ path: `${SHOTS}/states-report-loading-1280.png`, fullPage: true });
    } finally {
      releaseReport();
    }
    await expect(page.getByRole('heading', { name: copy.report.performanceTitle })).toBeVisible();
  });

  test('failed /meta: outage card, in-card error, no numbers, static pages still render', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    let metaDown = true;
    await page.route('**/api/meta', (route) =>
      metaDown ? offline(route) : answerMeta(route),
    );

    await page.goto('/score');
    await expect(page.getByText(copy.states.serviceUnavailable, { exact: true })).toBeVisible();
    await expect(page.getByText(copy.states.loadError, { exact: true })).toBeVisible();
    await expect(page.getByText(copy.score.metaFailure)).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(copy.score.h1);
    await expect(page.getByRole('spinbutton')).toHaveCount(0);
    expect(await page.locator('main').innerText()).not.toMatch(/\d/);
    await page.screenshot({ path: `${SHOTS}/states-meta-outage-1280.png`, fullPage: true });

    // The 404 is static: it still renders under the outage card.
    await page.goto('/no-such-page');
    await expect(page.getByText(copy.states.serviceUnavailable, { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(copy.notFound);
    await expect(
      page.locator('main').getByRole('link', { name: copy.nav.home }),
    ).toBeVisible();

    // Retry re-fetches /meta in place and clears both error regions.
    await page.goto('/score');
    await expect(page.getByText(copy.states.serviceUnavailable, { exact: true })).toBeVisible();
    metaDown = false;
    await page.getByRole('button', { name: copy.states.retry }).first().click();
    await expect(page.getByText(copy.states.serviceUnavailable, { exact: true })).toHaveCount(0);
    await expect(page.getByLabel('Loan type')).toBeVisible();
  });

  test('failed /score: in-card retry, no result numbers, form values kept', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.route('**/api/meta', answerMeta);
    await page.route('**/api/score', offline);

    await page.goto('/score');
    const meta = await mockGetMeta();
    for (const field of meta.fields) {
      if (field.type === 'select') {
        await page.getByLabel(field.label).selectOption('cash');
      } else {
        await page.getByLabel(field.label).fill('10');
      }
    }
    await page.getByRole('button', { name: copy.score.estimateRisk }).click();

    await expect(page).toHaveURL(/\/score$/);
    await expect(page.getByRole('alert')).toContainText(copy.score.submitError);
    await expect(page.getByRole('button', { name: copy.states.retry })).toBeVisible();
    await expect(page.getByText(copy.result.estimateEyebrow, { exact: true })).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1, name: copy.result.h1 })).toHaveCount(0);
    await expect(page.getByLabel('Loan amount requested')).toHaveValue('10');
    const mainText = await page.locator('main').innerText();
    expect(mainText).not.toMatch(/\d+\.\d/);
    expect(mainText).not.toMatch(/\d+%/);
    await page.screenshot({ path: `${SHOTS}/states-score-error-1280.png`, fullPage: true });
  });

  test('failed /report: in-card retry, no report numbers, retry recovers', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    let reportDown = true;
    await page.route('**/api/meta', answerMeta);
    await page.route('**/api/report', async (route) =>
      reportDown
        ? offline(route)
        : route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(await mockGetReport()),
          }),
    );

    await page.goto('/report');
    await expect(page.getByText(copy.states.loadError, { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: copy.states.retry })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: copy.report.performanceTitle }),
    ).toHaveCount(0);
    expect(await page.locator('main').innerText()).not.toMatch(/\d/);
    await page.screenshot({ path: `${SHOTS}/states-report-error-1280.png`, fullPage: true });

    reportDown = false;
    await page.getByRole('button', { name: copy.states.retry }).click();
    await expect(
      page.getByRole('heading', { name: copy.report.performanceTitle }),
    ).toBeVisible();
  });

  test('failed /score/batch (422): row errors, no results, corrected re-upload recovers', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    let rejectFile = true;
    await page.route('**/api/meta', answerMeta);
    await page.route('**/api/score/batch', async (route) =>
      rejectFile
        ? route.fulfill({
            status: 422,
            contentType: 'application/json',
            body: JSON.stringify({
              row_errors: [{ row: 14, message: 'Months of bureau history must be a number.' }],
            }),
          })
        : route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(await mockPostBatch()),
          }),
    );

    await page.goto('/batch');
    await expect(page.getByRole('button', { name: copy.batch.downloadTemplate })).toBeVisible();
    await page.locator('#applicant-file').setInputFiles({
      name: 'bad-rows.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('loan_type\n1\n'),
    });

    await expect(page.getByRole('alert')).toContainText('Row 14');
    await expect(page.getByText(copy.batch.applicantsScoredSample)).toHaveCount(0);

    // A 422 is a data error, not a transient outage: the UI asks for a fixed
    // file rather than showing a Retry button. Re-upload with the fixture route.
    rejectFile = false;
    const meta = await mockGetMeta();
    const header = meta.fields.map((field) => field.id).join(',');
    const row = meta.fields.map((field) => (field.type === 'select' ? 'cash' : '1')).join(',');
    await page.locator('#applicant-file').setInputFiles({
      name: 'corrected-rows.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(`${header}\n${row}\n`, 'utf8'),
    });
    await expect(page.getByText(copy.batch.applicantsScoredSample)).toBeVisible();
  });
});
