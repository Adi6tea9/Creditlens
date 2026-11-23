import type { Score } from '../api/schemas';

const MAX_BARS = 5;
const MIN_SCALE = 5;

type Contribution = Score['contributions'][number];

export interface ShownFactor extends Contribution {
  width: number;
}

export interface Reconciliation {
  top5: ShownFactor[];
  other: number;
  sumTop5: number;
  basePp: number;
  riskPp: number;
  total: number;
}

/** Spec 6.3.2 — bar width as a percentage of one half of the track. */
export function factorBarWidth(valuePp: number, maxAbsShown: number): number {
  return (Math.abs(valuePp) / Math.max(MIN_SCALE, maxAbsShown)) * 100;
}

export function reconcileScore(
  score: Pick<Score, 'risk' | 'base_rate' | 'contributions' | 'other_pp'>,
): Reconciliation {
  const riskPp = score.risk * 100;
  const basePp = score.base_rate * 100;
  const largest = [...score.contributions]
    .sort((a, b) => Math.abs(b.value_pp) - Math.abs(a.value_pp))
    .slice(0, MAX_BARS);

  // Spec 6.3.2 display order: positives by size, then negatives by size.
  const top5 = [
    ...largest.filter((c) => c.value_pp >= 0).sort((a, b) => b.value_pp - a.value_pp),
    ...largest.filter((c) => c.value_pp < 0).sort((a, b) => a.value_pp - b.value_pp),
  ];

  const sumTop5 = largest.reduce((sum, c) => sum + c.value_pp, 0);
  const other = riskPp - basePp - sumTop5;

  if (
    import.meta.env.DEV &&
    score.other_pp !== undefined &&
    Math.abs(score.other_pp - other) > 0.05
  ) {
    console.error(
      `SHAP reconciliation mismatch: API other_pp=${score.other_pp}, recomputed=${other}`,
    );
  }

  const maxAbsShown = Math.max(0, ...top5.map((c) => Math.abs(c.value_pp)));
  return {
    top5: top5.map((c) => ({ ...c, width: factorBarWidth(c.value_pp, maxAbsShown) })),
    other,
    sumTop5,
    basePp,
    riskPp,
    total: score.contributions.reduce((sum, c) => sum + c.value_pp, 0),
  };
}
