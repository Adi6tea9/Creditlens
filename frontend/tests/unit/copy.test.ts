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
