import {
  DEFAULT_APPROVE,
  DEFAULT_REJECT,
  THIN_FILE_DEFINITION,
  THIN_FILE_SHORT,
} from '../config/project';
import type { Batch, Meta, Report, Score } from './schemas';

/** Spec 10 — cumulative risk curve. x is percent risk; F is cumulative share. */
const CDF_X = [0, 2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20, 22.5, 25, 27.5, 30, 32.5, 35, 37.5, 40];
const CDF_F = [0, 0.15, 0.32, 0.48, 0.624, 0.714, 0.786, 0.838, 0.88, 0.91, 0.934, 0.954, 0.97, 0.982, 0.99, 0.996, 1];

const TOP_REASONS = [
  'Loan amount vs income',
  'Months of bureau history',
  'Monthly repayment vs income',
  'Years in current job',
  'Previous late payments',
];

/** Inverse-transform sample from the piecewise-linear CDF. Returns a fraction. */
function riskFromQuantile(u: number): number {
  for (let i = 1; i < CDF_X.length; i += 1) {
    if (u <= CDF_F[i]) {
      const span = CDF_F[i] - CDF_F[i - 1];
      const t = span === 0 ? 0 : (u - CDF_F[i - 1]) / span;
      return (CDF_X[i - 1] + t * (CDF_X[i] - CDF_X[i - 1])) / 100;
    }
  }
  return 0.4;
}

export async function getMeta(): Promise<Meta> {
  return {
    model_trained: false,
    is_sample: true,
    fields_final: false,
    loan_types: [
      { value: 'cash', label: 'Cash loan' },
      { value: 'revolving', label: 'Revolving loan' },
    ],
    loan_types_final: false,
    fields: [
      { id: 'loan_type', label: 'Loan type', group: 'The loan', type: 'select', required: true },
      {
        id: 'loan_amount',
        label: 'Loan amount requested',
        group: 'The loan',
        type: 'number',
        min: 0,
        step: 1,
        placeholder: 'e.g. 250000',
        required: true,
      },
      {
        id: 'monthly_repayment',
        label: 'Monthly repayment',
        group: 'The loan',
        type: 'number',
        min: 0,
        step: 1,
        placeholder: 'e.g. 12000',
        required: true,
      },
      {
        id: 'goods_price',
        label: 'Price of the goods being financed',
        group: 'The loan',
        type: 'number',
        min: 0,
        step: 1,
        placeholder: 'e.g. 225000',
        required: true,
      },
      {
        id: 'annual_income',
        label: 'Annual income',
        group: 'The applicant',
        type: 'number',
        min: 0,
        step: 1,
        placeholder: 'e.g. 180000',
        required: true,
      },
      {
        id: 'job_tenure_years',
        label: 'Years in current job',
        group: 'The applicant',
        type: 'number',
        min: 0,
        step: 0.1,
        placeholder: 'e.g. 3',
        required: true,
      },
      {
        id: 'bureau_history_months',
        label: 'Months of credit-bureau history',
        group: 'The applicant',
        type: 'number',
        min: 0,
        step: 1,
        placeholder: '0 if none',
        helper: '0 if none',
        required: true,
      },
      {
        id: 'previous_loans_with_lender',
        label: 'Previous loans with this lender',
        group: 'Past loans',
        type: 'number',
        min: 0,
        step: 1,
        placeholder: 'e.g. 1',
        required: true,
      },
      {
        id: 'previous_late_payments',
        label: 'Previous late payments',
        group: 'Past loans',
        type: 'number',
        min: 0,
        step: 1,
        placeholder: 'e.g. 0',
        required: true,
      },
    ],
    thin_file_definition: THIN_FILE_DEFINITION,
    thin_file_short: THIN_FILE_SHORT,
    default_approve: DEFAULT_APPROVE,
    default_reject: DEFAULT_REJECT,
  };
}

export async function postScore(): Promise<Score> {
  return {
    is_sample: true,
    risk: 0.14,
    range: [0.1, 0.19],
    base_rate: 0.09,
    is_thin_file: true,
    contributions: [
      { feature: 'loan_amount_vs_income', label: 'Loan amount vs income', value_pp: 4.1 },
      { feature: 'bureau_history_months', label: 'Months of bureau history', value_pp: 3.0 },
      { feature: 'repayment_vs_income', label: 'Monthly repayment vs income', value_pp: 1.7 },
      { feature: 'job_tenure_years', label: 'Years in current job', value_pp: -2.4 },
      { feature: 'previous_late_payments', label: 'Previous late payments', value_pp: -1.5 },
      { feature: 'previous_loans_with_lender', label: 'Previous loans with this lender', value_pp: 0.06 },
      { feature: 'goods_price', label: 'Price of the goods being financed', value_pp: 0.04 },
    ],
    other_pp: 0.1,
  };
}

export async function postBatch(): Promise<Batch> {
  const rows = Array.from({ length: 1000 }, (_, i) => {
    const u = (i + 0.5) / 1000;
    return {
      id: `App-${String(i + 1).padStart(5, '0')}`,
      risk: riskFromQuantile(u),
      is_thin_file: u < 0.312,
      top_reason: TOP_REASONS[i % TOP_REASONS.length],
    };
  });

  return {
    is_sample: true,
    n: rows.length,
    n_thin: rows.filter((row) => row.is_thin_file).length,
    rows,
  };
}

export async function getReport(): Promise<Report> {
  return {
    model_trained: false,
    is_sample: true,
    groups: [{ key: 'thin' }, { key: 'thick' }, { key: 'all' }],
    calibration: [],
    fairness: [],
  };
}
