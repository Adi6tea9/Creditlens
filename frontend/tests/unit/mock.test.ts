import { describe, expect, it } from 'vitest';

import { getMeta, getReport, postBatch, postScore } from '../../src/api/mock';

describe('mock layer', () => {
  it('returns the exact deterministic /score fixture', async () => {
    const score = await postScore();
    expect(score).toMatchObject({
      is_sample: true,
      risk: 0.14,
      range: [0.1, 0.19],
      base_rate: 0.09,
      is_thin_file: true,
      other_pp: 0.1,
    });
    expect(score.contributions.map((c) => c.value_pp)).toEqual([
      4.1, 3.0, 1.7, -2.4, -1.5, 0.06, 0.04,
    ]);
    expect(score.contributions.map((c) => c.label)).toEqual([
      'Loan amount vs income',
      'Months of bureau history',
      'Monthly repayment vs income',
      'Years in current job',
      'Previous late payments',
      'Previous loans with this lender',
      'Price of the goods being financed',
    ]);
  });

  it('returns 1,000 rows with 312 thin-file rows and stable ids', async () => {
    const batch = await postBatch();
    expect(batch.is_sample).toBe(true);
    expect(batch.n).toBe(1000);
    expect(batch.rows).toHaveLength(1000);
    expect(batch.rows.filter((row) => row.is_thin_file)).toHaveLength(312);
    expect(batch.n_thin).toBe(312);
    expect(batch.rows[0].id).toBe('App-00001');
    expect(batch.rows[999].id).toBe('App-01000');
    expect(new Set(batch.rows.map((row) => row.id)).size).toBe(1000);
  });

  it('uses quantile (i + 0.5) / 1000 and keeps every risk inside 0–40 percent', async () => {
    const { rows } = await postBatch();
    expect(rows[0].risk * 100).toBeLessThan(2.5);
    expect(rows[999].risk * 100).toBeCloseTo(39.6875, 3);
    expect(rows.every((row) => row.risk >= 0 && row.risk <= 0.4)).toBe(true);
    expect(new Set(rows.map((row) => row.top_reason)).size).toBe(5);
  });

  it('returns the nine provisional fields and placeholders from /meta', async () => {
    const meta = await getMeta();
    expect(meta.fields).toHaveLength(9);
    expect(meta.loan_types).toEqual([
      { value: 'cash', label: 'Cash loan' },
      { value: 'revolving', label: 'Revolving loan' },
    ]);
    expect(meta).toMatchObject({
      model_trained: false,
      is_sample: true,
      fields_final: false,
      loan_types_final: false,
      thin_file_short: '[DEFINITION]',
      default_approve: 10,
      default_reject: 20,
    });
  });

  it('returns an untrained report with dash-ready empty data', async () => {
    const report = await getReport();
    expect(report.model_trained).toBe(false);
    expect(report.groups.map((group) => group.key)).toEqual(['thin', 'thick', 'all']);
    expect(report.groups.every((group) => group.roc_auc === undefined)).toBe(true);
    expect(report.calibration).toEqual([]);
    expect(report.fairness).toEqual([]);
  });
});
