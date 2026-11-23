import { describe, expect, it } from 'vitest';

import { postBatch } from '../../src/api/mock';
import { bandCounts, bandFor, bandPercentages } from '../../src/lib/bands';

describe('risk bands', () => {
  it('sends risk equal to either cutoff to Review', () => {
    expect(bandFor(10, 10, 20)).toBe('Review');
    expect(bandFor(20, 10, 20)).toBe('Review');
    expect(bandFor(9.9, 10, 20)).toBe('Approve');
    expect(bandFor(20.1, 10, 20)).toBe('Reject');
  });

  it('counts the mock batch as 624 / 256 / 120 at cutoffs 10 / 20', async () => {
    const { rows } = await postBatch();
    const counts = bandCounts(
      rows.map((row) => row.risk * 100),
      10,
      20,
    );
    expect(counts).toEqual({ Approve: 624, Review: 256, Reject: 120 });
  });

  it('displays percentages that add to exactly 100.0', () => {
    const percentages = bandPercentages({ Approve: 624, Review: 256, Reject: 120 });
    expect(percentages).toEqual({ Approve: 62.4, Review: 25.6, Reject: 12 });
    expect(percentages.Approve + percentages.Review + percentages.Reject).toBe(100);
  });

  it('applies largest-remainder rounding when shares do not divide evenly', () => {
    const percentages = bandPercentages({ Approve: 1, Review: 1, Reject: 1 });
    const displayedTotal = Math.round((percentages.Approve + percentages.Review + percentages.Reject) * 10) / 10;
    expect(displayedTotal).toBe(100);
  });
});
