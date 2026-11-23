export type Band = 'Approve' | 'Review' | 'Reject';

/** Spec 6.4: equal to either cutoff is Review. */
export function bandFor(risk: number, approve: number, reject: number): Band {
  if (risk < approve) return 'Approve';
  if (risk > reject) return 'Reject';
  return 'Review';
}

export function bandCounts(
  risks: number[],
  approve: number,
  reject: number,
): Record<Band, number> {
  const counts: Record<Band, number> = { Approve: 0, Review: 0, Reject: 0 };
  for (const risk of risks) counts[bandFor(risk, approve, reject)] += 1;
  return counts;
}

/** Largest-remainder rounding to one decimal so displayed shares total exactly 100.0. */
export function bandPercentages(counts: Record<Band, number>): Record<Band, number> {
  const bands: Band[] = ['Approve', 'Review', 'Reject'];
  const n = bands.reduce((sum, band) => sum + counts[band], 0);
  if (n === 0) return { Approve: 0, Review: 0, Reject: 0 };

  const exact = bands.map((band) => (counts[band] / n) * 1000);
  const tenths = exact.map(Math.floor);
  const remainder = 1000 - tenths.reduce((sum, value) => sum + value, 0);
  const byRemainder = bands
    .map((_, i) => ({ i, fraction: exact[i] - tenths[i] }))
    .sort((a, b) => b.fraction - a.fraction || a.i - b.i);

  for (let i = 0; i < remainder; i += 1) tenths[byRemainder[i % bands.length].i] += 1;

  return {
    Approve: tenths[0] / 10,
    Review: tenths[1] / 10,
    Reject: tenths[2] / 10,
  };
}
