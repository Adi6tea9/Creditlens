import { expect, test, type Page } from '@playwright/test';

import { getMeta as mockGetMeta, postBatch as mockPostBatch } from '../../src/api/mock';
import { copy } from '../../src/content/copy';

test.use({ baseURL: 'http://127.0.0.1:4174' });

async function setRange(page: Page, selector: string, value: string) {
  await page.locator(selector).evaluate((input, next) => {
    const el = input as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    setter.call(el, next);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

test.describe('quality bar e2e (mock mode)', () => {
  test('mock mode: home → score → result', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page
      .getByRole('navigation', { name: 'Primary Navigation' })
      .getByRole('link', { name: 'Score an applicant' })
      .click();
    await expect(page).toHaveURL(/\/score$/);
    await expect(page.getByLabel('Loan type')).toBeVisible();

    const meta = await mockGetMeta();
    for (const field of meta.fields) {
      if (field.type === 'select') {
        await page.getByLabel(field.label).selectOption('cash');
      } else {
        await page.getByLabel(field.label).fill('10');
      }
    }
    await page.getByRole('button', { name: copy.score.estimateRisk }).click();

    await expect(page).toHaveURL(/\/score\/result$/);
    await expect(page.getByRole('heading', { level: 1, name: copy.result.h1 })).toBeVisible();
    await expect(page.getByText(`${copy.result.sampleBannerLabel}.`)).toBeVisible();
  });

  test('mock mode: batch sliders move counts, bar, table pills and histogram together', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const fixture = await mockPostBatch();
    const boundary = fixture.rows.find(
      (row) => row.risk * 100 > 5.5 && row.risk * 100 < 10,
    )!;
    const pageIndex = Math.floor(fixture.rows.indexOf(boundary) / 50);

    await page.goto('/batch');
    await expect(page.getByText(copy.batch.applicantsScoredSample)).toBeVisible();
    for (let i = 0; i < pageIndex; i += 1) {
      await page.getByRole('button', { name: copy.batch.next }).click();
    }
    const boundaryRow = page
      .getByRole('rowheader', { name: boundary.id })
      .locator('xpath=ancestor::tr');
    await expect(boundaryRow).toContainText(copy.batch.approve);

    await setRange(page, '#approve-cutoff', '5.5');

    await expect(page.getByText('352', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('35.2% of file')).toBeVisible();
    expect(
      await page.getByTestId('bar-approve').evaluate((el) => (el as HTMLElement).style.width),
    ).toBe('35.2%');
    expect(
      await page.getByTestId('hist-approve-line').evaluate((el) => (el as HTMLElement).style.left),
    ).toBe('13.75%');
    await expect(
      page.getByRole('img', {
        name: 'Histogram of estimated risk for 1000 applicants, with cutoffs at 5.5 and 20.0 percent',
      }),
    ).toBeVisible();
    await expect(boundaryRow).toContainText(copy.batch.review);
  });

  test('mock mode: report shows dashes until training', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/report');
    await expect(page.getByText('No model has been trained yet.')).toBeVisible();

    const performance = page.getByRole('table', { name: copy.report.performanceTitle });
    for (const label of [
      copy.report.thinFile,
      copy.report.thickFile,
      copy.report.allApplicants,
    ]) {
      const cells = performance
        .getByRole('rowheader', { name: label })
        .locator('xpath=ancestor::tr')
        .locator('td');
      await expect(cells).toHaveCount(7);
      for (let i = 0; i < 7; i += 1) {
        await expect(cells.nth(i)).toHaveText(copy.batch.dash);
      }
    }

    const fairness = page.getByRole('table', { name: copy.report.fairnessTitle });
    for (const label of copy.report.fairnessMockRows) {
      const cells = fairness
        .getByRole('rowheader', { name: label })
        .locator('xpath=ancestor::tr')
        .locator('td');
      await expect(cells).toHaveCount(2);
      await expect(cells.nth(0)).toHaveText(copy.batch.dash);
      await expect(cells.nth(1)).toHaveText(copy.batch.dash);
    }

    await expect(page.getByRole('img', { name: copy.report.calibrationEmptyAria })).toBeVisible();
  });
});
