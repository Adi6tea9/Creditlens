import { expect, test } from '@playwright/test';

import { getMeta as fixtureMeta } from '../../src/api/mock';
import type { Batch } from '../../src/api/schemas';
import { copy } from '../../src/content/copy';

// Production build (no VITE_USE_MOCK). API routes are intercepted with
// realistic fixtures because no live backend is available in this repo.
test.use({ baseURL: 'http://127.0.0.1:4173' });

const ROW_COUNT = 100_000;

interface DragMetrics {
  updates: number;
  minMs: number;
  medianMs: number;
  p95Ms: number;
  maxMs: number;
  maxFrameGapMs: number;
  longTaskCount: number;
  longTaskMaxMs: number;
  finalWidth: string;
}

function buildBatch(): Batch {
  let nThin = 0;
  const rows = Array.from({ length: ROW_COUNT }, (_, i) => {
    const isThin = i % 7 === 0;
    if (isThin) nThin += 1;
    return {
      id: `R-${String(i + 1).padStart(6, '0')}`,
      risk: (i + 0.5) / ROW_COUNT,
      is_thin_file: isThin,
    };
  });
  return { is_sample: false, n: ROW_COUNT, n_thin: nThin, rows };
}

test.describe('browser performance (non-mock production build)', () => {
  test.setTimeout(180_000);

  test('100k-row CSV upload + slider drag stays responsive', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    const meta = await fixtureMeta();
    const header = meta.fields.map((field) => field.id).join(',');
    const csv = `${header}\n${Array.from({ length: ROW_COUNT }, (_, i) =>
      meta.fields
        .map((field) => (field.type === 'select' ? 'cash' : String((i % 9) + 1)))
        .join(','),
    ).join('\n')}\n`;
    const csvBuffer = Buffer.from(csv, 'utf8');
    const batch = buildBatch();

    let postedBytes = 0;
    await page.route('**/api/meta', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(meta) }),
    );
    await page.route('**/api/score/batch', async (route) => {
      postedBytes = route.request().postDataBuffer()?.byteLength ?? 0;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(batch),
      });
    });

    await page.goto('/batch');
    await expect(page.getByRole('button', { name: copy.batch.downloadTemplate })).toBeVisible();

    await page.locator('#applicant-file').setInputFiles({
      name: '100k-applicants.csv',
      mimeType: 'text/csv',
      buffer: csvBuffer,
    });

    await expect(page.getByText(copy.batch.applicantsScored)).toBeVisible();
    await expect(page.getByText(copy.batch.applicantsScoredSample)).toHaveCount(0);
    await expect(page.getByText('100,000', { exact: true }).first()).toBeVisible();
    expect(postedBytes).toBeGreaterThanOrEqual(csvBuffer.byteLength);

    const metrics: DragMetrics = await page.evaluate(
      async ({ updates }) => {
        const slider = document.querySelector('#approve-cutoff') as HTMLInputElement;
        const bar = document.querySelector('[data-testid="bar-approve"]') as HTMLElement;

        const setNativeValue = (value: string) => {
          const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
          setter.call(slider, value);
        };
        const fire = (value: string) => {
          setNativeValue(value);
          slider.dispatchEvent(new Event('input', { bubbles: true }));
          slider.dispatchEvent(new Event('change', { bubbles: true }));
        };
        const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

        // Warm up React and JIT before measuring.
        for (let i = 0; i < 3; i += 1) {
          fire(String(5 + i * 0.5));
          await nextFrame();
        }

        const updateMs: number[] = [];
        const frameGaps: number[] = [];
        const longTasks: number[] = [];
        let sampling = true;
        let lastFrame = performance.now();

        const frame = (now: number) => {
          if (!sampling) return;
          frameGaps.push(now - lastFrame);
          lastFrame = now;
          requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);

        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) longTasks.push(entry.duration);
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });

        for (let i = 0; i < updates; i += 1) {
          const value = String(5 + (i % 25) * 0.5);
          const before = bar.style.width;
          const start = performance.now();
          await new Promise<void>((resolve, reject) => {
            const observer = new MutationObserver(() => {
              if (bar.style.width !== before) {
                observer.disconnect();
                resolve();
              }
            });
            observer.observe(bar, { attributes: true, attributeFilter: ['style'] });
            fire(value);
            window.setTimeout(() => {
              observer.disconnect();
              reject(new Error('slider update did not reach the DOM'));
            }, 1000);
          });
          updateMs.push(performance.now() - start);
          await nextFrame();
        }

        sampling = false;
        longTaskObserver.disconnect();
        const sorted = [...updateMs].sort((a, b) => a - b);
        return {
          updates: updateMs.length,
          minMs: sorted[0],
          medianMs: sorted[Math.floor(sorted.length / 2)],
          p95Ms: sorted[Math.floor(sorted.length * 0.95)],
          maxMs: sorted[sorted.length - 1],
          maxFrameGapMs: Math.max(...frameGaps),
          longTaskCount: longTasks.length,
          longTaskMaxMs: longTasks.length ? Math.max(...longTasks) : 0,
          finalWidth: bar.style.width,
        };
      },
      { updates: 40 },
    );

    console.log(
      `[browser-100k-drag] rows=${ROW_COUNT} csvBytes=${csvBuffer.byteLength} postedBytes=${postedBytes} ${JSON.stringify(metrics)}`,
    );

    expect(metrics.updates).toBe(40);
    expect(metrics.p95Ms).toBeLessThan(16);
    expect(metrics.maxFrameGapMs).toBeLessThan(50);
    expect(metrics.longTaskMaxMs).toBeLessThan(50);
    expect(metrics.finalWidth).toMatch(/%$/u);
  });
});
