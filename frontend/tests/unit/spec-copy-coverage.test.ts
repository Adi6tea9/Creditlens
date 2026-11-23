import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { intentionallyAbsent, nonCopyPatterns } from '../spec-copy-allowlist';

// Vitest runs with cwd = frontend/.
const spec = readFileSync(resolve(process.cwd(), '../docs/FRONTEND_MASTER_SPEC.md'), 'utf8');
const copySource = readFileSync(resolve(process.cwd(), 'src/content/copy.ts'), 'utf8');

const scope = spec.slice(spec.indexOf('## 6.'), spec.indexOf('## 9.'));
expect(scope.length).toBeGreaterThan(0);

const spans = [...new Set([...scope.matchAll(/`([^`]+)`/g)].map((match) => match[1]))];

// Backtick spans starting with a capital, or lowercase sentences, are copy.
// Paths, CSS, code identifiers and numeric examples are classified out by the
// explicit patterns in the allowlist file.
const isCopyCandidate = (text: string): boolean =>
  (/^[A-Z]/u.test(text) ||
    (/[a-z]/u.test(text) && text.includes('.') && /\s/u.test(text))) &&
  !nonCopyPatterns.some((rule) => rule.pattern.test(text));

const candidates = spans.filter(isCopyCandidate);
const allowlisted = new Set<string>(intentionallyAbsent.map((entry) => entry.spec));

describe('spec sections 6-8 user-facing strings all exist in copy.ts', () => {
  it('extracts a non-trivial set of spec strings', () => {
    expect(spans.length).toBeGreaterThan(100);
    expect(candidates.length).toBeGreaterThan(100);
  });

  it('fails for any spec string missing from copy.ts and the allowlist', () => {
    const missing = candidates.filter((text) => !copySource.includes(text) && !allowlisted.has(text));
    expect(missing).toEqual([]);
  });

  it('does not allowlist strings absent from the spec', () => {
    const stale = intentionallyAbsent
      .filter((entry) => !scope.includes(`\`${entry.spec}\``))
      .map((entry) => entry.spec);
    expect(stale).toEqual([]);
  });

  it('keeps a reason for every allowlist entry that is still absent from copy.ts', () => {
    const invalid = intentionallyAbsent
      .filter((entry) => !entry.reason.trim() || copySource.includes(entry.spec))
      .map((entry) => entry.spec);
    expect(invalid).toEqual([]);
  });
});
