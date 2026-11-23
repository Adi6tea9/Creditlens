import { afterEach, describe, expect, it, vi } from 'vitest';

import { postScore } from '../../src/api/mock';
import { factorBarWidth, reconcileScore } from '../../src/lib/reconcile';

describe('SHAP reconciliation', () => {
  afterEach(() => vi.restoreAllMocks());

  it('reconciles base 9.0 + factors 5.0 = risk 14.0', async () => {
    const result = reconcileScore(await postScore());
    expect(result.basePp).toBeCloseTo(9, 5);
    expect(result.sumTop5 + result.other).toBeCloseTo(5, 5);
    expect(result.basePp + result.sumTop5 + result.other).toBeCloseTo(14, 5);
    expect(result.riskPp).toBeCloseTo(14, 5);
  });

  it('orders the top five positives first and yields widths 82 / 60 / 34 / 48 / 30', async () => {
    const result = reconcileScore(await postScore());
    expect(result.top5.map((factor) => factor.value_pp)).toEqual([4.1, 3.0, 1.7, -2.4, -1.5]);
    expect(result.top5.map((factor) => Math.round(factor.width))).toEqual([82, 60, 34, 48, 30]);
    expect(factorBarWidth(5, 2)).toBe(100);
  });

  it('logs a dev error when the API other_pp differs by more than 0.05', async () => {
    const score = await postScore();
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    reconcileScore({ ...score, other_pp: 99 });
    expect(error).toHaveBeenCalledOnce();
  });

  it('reconciles random contribution sets within 0.05', () => {
    for (let trial = 0; trial < 50; trial += 1) {
      const contributions = Array.from({ length: 9 }, (_, i) => ({
        feature: `f${i}`,
        label: `f${i}`,
        value_pp: Math.round((Math.random() - 0.5) * 200) / 10,
      }));
      const base_rate = 0.05 + Math.random() * 0.1;
      const total = contributions.reduce((sum, c) => sum + c.value_pp, 0);
      const risk = Math.min(1, Math.max(0, base_rate + total / 100));
      const result = reconcileScore({ risk, base_rate, contributions });
      expect(Math.abs(result.sumTop5 + result.other - (result.riskPp - result.basePp))).toBeLessThan(0.05);
    }
  });
});
