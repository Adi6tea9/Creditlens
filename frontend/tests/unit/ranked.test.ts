import { describe, expect, it } from 'vitest';

import { postBatch } from '../../src/api/mock';
import { copy } from '../../src/content/copy';
import { bandPercentages } from '../../src/lib/bands';
import {
  prepareRanking,
  rankedCounts,
  rankedCsv,
  rankedPage,
  rankedRows,
} from '../../src/lib/ranked';

describe('ranked batch derivation (spec 6.4)', () => {
  it('uses one bandFor derivation for counts, percentages and bar widths', async () => {
    const batch = await postBatch();
    const rows = rankedRows(batch, 10, 20);
    const counts = { Approve: 0, Review: 0, Reject: 0 };
    for (const row of rows) counts[row.band] += 1;

    expect(counts).toEqual({ Approve: 624, Review: 256, Reject: 120 });
    const percentages = bandPercentages(counts);
    expect(percentages).toEqual({ Approve: 62.4, Review: 25.6, Reject: 12 });
    expect(percentages.Approve + percentages.Review + percentages.Reject).toBe(100);
    expect(rows).toHaveLength(batch.rows.length);
    expect(rows[0].id).toBe('App-00001');
    expect(rows.at(-1)?.rank).toBe(1000);
  });

  it('changes counts, pills and bar widths together at approve 5.5', async () => {
    const batch = await postBatch();
    const before = rankedRows(batch, 10, 20);
    const after = rankedRows(batch, 5.5, 20);
    const boundary = before.find((row) => row.risk > 0.055 && row.risk < 0.1)!;

    expect(boundary.band).toBe('Approve');
    expect(after.find((row) => row.id === boundary.id)?.band).toBe('Review');

    const counts = { Approve: 0, Review: 0, Reject: 0 };
    for (const row of after) counts[row.band] += 1;
    expect(counts).toEqual({ Approve: 352, Review: 528, Reject: 120 });
    expect(bandPercentages(counts)).toEqual({ Approve: 35.2, Review: 52.8, Reject: 12 });
  });

  it('keeps a slider update under 16 ms over 100,000 synthetic rows (spec 12.2)', () => {
    const batch = {
      is_sample: false,
      n: 100_000,
      n_thin: 0,
      rows: Array.from({ length: 100_000 }, (_, i) => ({
        id: `R-${String(i).padStart(6, '0')}`,
        risk: ((i * 37) % 1000) / 10_000,
        is_thin_file: i % 3 === 0,
      })),
    };
    const prepared = prepareRanking(batch);
    rankedCounts(prepared, 10, 20);
    rankedPage(prepared, 10, 20, 0, 50);

    const iterations = 100;
    let latest = rankedCounts(prepared, 10, 20);
    const start = performance.now();
    for (let i = 0; i < iterations; i += 1) {
      const approve = 5 + (i % 50) / 10;
      latest = rankedCounts(prepared, approve, 20);
      rankedPage(prepared, approve, 20, 0, 50);
    }
    const perUpdate = (performance.now() - start) / iterations;

    expect(latest.Approve + latest.Review + latest.Reject).toBe(100_000);
    expect(rankedPage(prepared, 5.5, 20, 0, 50)).toHaveLength(50);
    console.log(`100k-row slider update: ${perUpdate.toFixed(3)} ms/update`);
    expect(perUpdate).toBeLessThan(16);
  });

  it('writes the full current-cutoff CSV with the exact header and file labels', async () => {
    const batch = await postBatch();
    const csv = rankedCsv(rankedRows(batch, 5.5, 20));
    const lines = csv.split('\r\n');

    expect(lines[0]).toBe(copy.batch.csvHeader);
    expect(lines).toHaveLength(batch.rows.length + 1);
    expect(lines[1]).toMatch(/^1,App-00001,\d+\.\d,Approve,(Thin-file|Thick-file),/);
    expect(csv).not.toContain('%');
  });

  it('guards injected cells in the full CSV export', async () => {
    const batch = await postBatch();
    batch.rows[0].id = '=HYPERLINK("x")';
    batch.rows[0].top_reason = '@SUM(A1)';
    const csv = rankedCsv(rankedRows(batch, 10, 20));

    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
    expect(csv).toContain("'@SUM(A1)");
  });
});
