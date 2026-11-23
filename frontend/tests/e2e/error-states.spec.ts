import { expect, test } from '@playwright/test';

import { getMeta as mockGetMeta, getReport as mockGetReport } from '../../src/api/mock';
import { copy } from '../../src/content/copy';

// The production build has no backend, so routed failures exercise the real
// API error paths (mock mode would answer locally and never hit the network).
test.use({ baseURL: 'http://127.0.0.1:4173' });

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
  test('failed /meta: outage card, in-card error, no numbers, static pages still render', async ({
    page,
  }) => {
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
  });

  test('failed /report: in-card retry, no report numbers, retry recovers', async ({ page }) => {
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

    reportDown = false;
    await page.getByRole('button', { name: copy.states.retry }).click();
    await expect(
      page.getByRole('heading', { name: copy.report.performanceTitle }),
    ).toBeVisible();
  });
});
