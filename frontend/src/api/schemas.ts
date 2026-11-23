import { z } from 'zod';

/** Spec 9: risks are fractions 0–1 on the wire; contributions are percentage points. */
const fraction = z.number().min(0).max(1);

const groupKey = z.enum(['thin', 'thick', 'all']);

export const loanTypeSchema = z.object({
  value: z.string(),
  label: z.string(),
});

export const fieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  group: z.enum(['The loan', 'The applicant', 'Past loans']),
  type: z.enum(['number', 'select']),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
  placeholder: z.string().optional(),
  helper: z.string().optional(),
  required: z.boolean(),
});

export const metaSchema = z.object({
  model_trained: z.boolean(),
  is_sample: z.boolean(),
  fields_final: z.boolean(),
  loan_types: z.array(loanTypeSchema),
  loan_types_final: z.boolean(),
  fields: z.array(fieldSchema),
  thin_file_definition: z.string(),
  thin_file_short: z.string(),
  default_approve: z.number(),
  default_reject: z.number(),
});

export const scoreSchema = z.object({
  is_sample: z.boolean(),
  risk: fraction,
  range: z.tuple([fraction, fraction]).optional(),
  base_rate: fraction,
  is_thin_file: z.boolean(),
  contributions: z.array(
    z.object({
      feature: z.string(),
      label: z.string(),
      value_pp: z.number(),
    }),
  ),
  other_pp: z.number().optional(),
});

export const batchSchema = z.object({
  is_sample: z.boolean(),
  n: z.number(),
  n_thin: z.number(),
  rows: z.array(
    z.object({
      id: z.string(),
      risk: fraction,
      is_thin_file: z.boolean(),
      top_reason: z.string().optional(),
    }),
  ),
});

export const batchErrorSchema = z.object({
  row_errors: z.array(z.object({ row: z.number(), message: z.string() })),
  detail: z.string().optional(),
});

export const reportSchema = z.object({
  model_trained: z.boolean(),
  is_sample: z.boolean(),
  evaluation_note: z.string().optional(),
  groups: z.array(
    z.object({
      key: groupKey,
      n: z.number().optional(),
      default_rate: fraction.optional(),
      roc_auc: z.number().optional(),
      pr_auc: z.number().optional(),
      ks: z.number().optional(),
      calibration_error: z.number().optional(),
      auc_ci: z.tuple([z.number(), z.number()]).optional(),
      inconclusive: z.boolean().optional(),
    }),
  ),
  calibration: z.array(
    z.object({
      key: groupKey,
      points: z.array(z.object({ pred: fraction, obs: fraction, n: z.number() })),
    }),
  ),
  fairness: z.array(
    z.object({
      dimension: z.string(),
      groups: z.array(
        z.object({
          label: z.string(),
          error_rate: fraction.optional(),
          calibration_gap: fraction.optional(),
        }),
      ),
    }),
  ),
});

export type Meta = z.infer<typeof metaSchema>;
export type Score = z.infer<typeof scoreSchema>;
export type Batch = z.infer<typeof batchSchema>;
export type BatchError = z.infer<typeof batchErrorSchema>;
export type Report = z.infer<typeof reportSchema>;
