import { describe, expect, it } from 'vitest';

import { getMeta, getReport, postBatch, postScore } from '../../src/api/mock';
import {
  batchSchema,
  metaSchema,
  reportSchema,
  scoreSchema,
} from '../../src/api/schemas';

describe('API response schemas', () => {
  it('accepts every valid mock response', async () => {
    const meta = await getMeta();
    const score = await postScore();
    const batch = await postBatch();
    const report = await getReport();

    expect(() => metaSchema.parse(meta)).not.toThrow();
    expect(() => scoreSchema.parse(score)).not.toThrow();
    expect(() => batchSchema.parse(batch)).not.toThrow();
    expect(() => reportSchema.parse(report)).not.toThrow();
  });

  it('rejects risks outside the 0–1 wire range', async () => {
    const score = await postScore();
    expect(() => scoreSchema.parse({ ...score, risk: 14 })).toThrow();
    expect(() => scoreSchema.parse({ ...score, range: [0.1, 1.9] })).toThrow();
  });

  it('rejects an unknown field group or type', async () => {
    const meta = await getMeta();
    expect(() =>
      metaSchema.parse({
        ...meta,
        fields: [{ ...meta.fields[0], group: 'Unknown' }],
      }),
    ).toThrow();
  });
});
