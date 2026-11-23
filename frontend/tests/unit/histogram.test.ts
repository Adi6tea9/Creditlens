import { describe, expect, it } from 'vitest';

import { postBatch } from '../../src/api/mock';
import { binForRisk, histogramBins } from '../../src/lib/histogram';

describe('histogram', () => {
  it('has 16 bins of 2.5 points spanning 0–40', () => {
    const bins = histogramBins([]);
    expect(bins).toHaveLength(16);
    expect(bins[0]).toEqual({ index: 0, start: 0, end: 2.5, count: 0 });
    expect(bins[15]).toEqual({ index: 15, start: 37.5, end: 40, count: 0 });
  });

  it('puts 40 and above in the last bin and keeps the total count equal to n', () => {
    const risks = [0, 2.4, 2.5, 10, 39.9, 40, 55];
    const bins = histogramBins(risks);
    expect(binForRisk(40)).toBe(15);
    expect(binForRisk(55)).toBe(15);
    expect(bins[15].count).toBe(3); // 39.9, 40 and 55
    expect(bins.reduce((sum, bin) => sum + bin.count, 0)).toBe(risks.length);
  });

  it('bins every mock row exactly once', async () => {
    const batch = await postBatch();
    const bins = histogramBins(batch.rows.map((row) => row.risk * 100));
    expect(bins.reduce((sum, bin) => sum + bin.count, 0)).toBe(batch.n);
  });
});
