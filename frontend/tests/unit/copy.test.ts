import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  REPO_URL,
  THIN_FILE_DEFINITION,
  THIN_FILE_SHORT,
} from '../../src/config/project';
import { copy, fill, placeholderDefaults } from '../../src/content/copy';

// Vitest runs with cwd = frontend/.
const spec = readFileSync(resolve(process.cwd(), '../docs/FRONTEND_MASTER_SPEC.md'), 'utf8');
const copySource = readFileSync(resolve(process.cwd(), 'src/content/copy.ts'), 'utf8');

// Section 7 only: from its heading up to the section 8 heading.
const start = spec.indexOf('## 7.');
const end = spec.indexOf('## 8.');
expect(start).toBeGreaterThan(-1);
expect(end).toBeGreaterThan(start);
const section7 = spec.slice(start, end);

// Every backtick-quoted span is copy, except API/path references like
// `/meta`, `/meta.model_trained`, `/meta.thin_file_short` (user-approved skip).
const spans = [...section7.matchAll(/`([^`]+)`/g)].map((match) => match[1]);
const quotedStrings = [...new Set(spans.filter((span) => !span.startsWith('/')))];
const skippedReferences = [...new Set(spans.filter((span) => span.startsWith('/')))];

describe('spec section 7 copy is verbatim', () => {
  it('extracts a non-trivial set of quoted strings from section 7', () => {
    expect(quotedStrings.length).toBeGreaterThan(50);
  });

  it.each(quotedStrings)('exists character-for-character in copy.ts: %s', (text) => {
    expect(copySource.includes(text)).toBe(true);
  });

  it('skips only API/path reference spans', () => {
    expect(skippedReferences).toEqual([
      '/meta.model_trained',
      '/meta',
      '/meta.thin_file_short',
    ]);
  });
});

describe('placeholders are filled, never retyped', () => {
  it('keeps the spec tokens verbatim in copy.ts', () => {
    expect(copySource.includes('{REPO_URL}')).toBe(true);
    expect(copySource.includes('{thin_file_definition}')).toBe(true);
    expect(copySource.includes('{thin_file_short}')).toBe(true);
  });

  it('contains none of the config placeholder literals', () => {
    for (const literal of [
      '[YOUR REPO LINK]',
      '[DEFINITION: set from bureau coverage before looking at outcomes]',
      '[DEFINITION]',
    ]) {
      expect(copySource.includes(literal)).toBe(false);
    }
  });

  it('sources defaults from config/project.ts', () => {
    expect(placeholderDefaults).toEqual({
      REPO_URL,
      thin_file_definition: THIN_FILE_DEFINITION,
      thin_file_short: THIN_FILE_SHORT,
    });
  });

  it('fill() substitutes known tokens and leaves unknown ones untouched', () => {
    expect(fill(copy.footer, placeholderDefaults)).toBe(
      `Research and portfolio project. Uses the Home Credit Default Risk dataset from Kaggle under Kaggle's competition rules. Not affiliated with Home Credit or Kaggle. Source: ${REPO_URL}`,
    );
    expect(fill(copy.thinFileCard, { thin_file_short: 'fewer than 12 months of bureau history' })).toBe(
      "This applicant is thin-file under this project's rule: fewer than 12 months of bureau history. The model has less to go on here, so treat the estimate as less certain and read the range, not just the single number.",
    );
    expect(fill('Value: {unknown}', {})).toBe('Value: {unknown}');
    expect(fill(copy.batch.showing, { a: 1, b: 50, n: 1000 })).toBe('Showing 1–50 of 1000');
  });
});

// ---- Hardening: token safety, §6/§8 verbatim, forbidden wording ----------

/** Every leaf string in copy, with its dot path (e.g. score.getBack.1). */
function stringEntries(value: unknown, prefix = ''): Array<[string, string]> {
  if (typeof value === 'string') return [[prefix, value]];
  if (Array.isArray(value)) {
    return value.flatMap((item, i) => stringEntries(item, `${prefix}.${i}`));
  }
  if (value !== null && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) =>
      stringEntries(item, prefix ? `${prefix}.${key}` : key),
    );
  }
  return [];
}

const entries = stringEntries(copy);

// Complete token set: the three config/meta placeholders plus every runtime
// token the spec's templates use (§6.4 KPI subs, pagination).
const completeTokens = {
  ...placeholderDefaults,
  n_thin: 312,
  pct: 31.2,
  a: 1,
  b: 50,
  n: 1000,
};

const sections6to8 = spec.slice(spec.indexOf('## 6.'), spec.indexOf('## 9.'));

describe('token safety', () => {
  it('finds a non-trivial number of copy strings', () => {
    expect(entries.length).toBeGreaterThan(100);
  });

  it.each(entries)('fill() leaves no {token} behind: %s', (_key, text) => {
    expect(fill(text, completeTokens)).not.toMatch(/\{\w+\}/);
  });

  it('every {token} used in copy is a key of the accepted token set', () => {
    const allowed = new Set(Object.keys(completeTokens));
    const offenders = entries.flatMap(([key, text]) =>
      [...text.matchAll(/\{(\w+)\}/g)]
        .filter((match) => !allowed.has(match[1]))
        .map((match) => `${key}: {${match[1]}}`),
    );
    expect(offenders).toEqual([]);
  });
});

describe('spec sections 6-8 copy is verbatim (full string in spec)', () => {
  // Each full copy value must appear in spec §6-§8. No normalizations are
  // needed today: even derived strings (batch.footnoteReal, result.rangePrefix,
  // result.reconciliationLabels) are contiguous substrings of spec sentences.
  // If a future string intentionally differs, comment it here and assert its
  // normalized form — do not silently loosen the check.
  it.each(entries)('%s appears verbatim in spec sections 6-8', (_key, text) => {
    expect(sections6to8.includes(text)).toBe(true);
  });
});

describe('forbidden wording', () => {
  // Owner-approved documented exception (see CONTRACT_GAPS.md): spec §7.3
  // mandates this exact string, and the §7 verbatim test requires it.
  // Flagged, not reworded. Remove this entry only when the spec changes.
  const documentedExceptions = new Set(['score.getBack.1']);

  const hits = entries.filter(([, text]) => /80\s?%|confidence/i.test(text));

  it('flags every hit by key (reported, never auto-fixed)', () => {
    // Kept as an assertion so the hit list stays visible and current.
    expect(hits.map(([key]) => key)).toEqual(['score.getBack.1']);
  });

  it('has no forbidden wording beyond the documented exceptions', () => {
    const unexpected = hits.filter(([key]) => !documentedExceptions.has(key));
    expect(unexpected).toEqual([]);
  });

  it('keeps the exception list honest (no stale entries)', () => {
    const hitKeys = new Set(hits.map(([key]) => key));
    for (const key of documentedExceptions) {
      expect(hitKeys.has(key)).toBe(true);
    }
  });
});
