import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  invalidPlaceholderValues,
  readPlaceholderValues,
} from '../../scripts/placeholder-rules.mjs';
import {
  REPO_URL,
  THIN_FILE_DEFINITION,
  THIN_FILE_SHORT,
} from '../../src/config/project';

const configSource = readFileSync(resolve(process.cwd(), 'src/config/project.ts'), 'utf8');

describe('release guard for section 11 values', () => {
  it('reads all three config values from project.ts', () => {
    const values = readPlaceholderValues(configSource);
    expect(values).toEqual({
      REPO_URL,
      THIN_FILE_DEFINITION,
      THIN_FILE_SHORT,
    });
  });

  it('rejects a value containing <', () => {
    const source = configSource.replace(REPO_URL, 'https://github.com/<user>/<repo>');
    expect(invalidPlaceholderValues(readPlaceholderValues(source))).toContain(
      'REPO_URL contains < or >',
    );
  });

  it('rejects a value containing >', () => {
    const source = configSource.replace(THIN_FILE_SHORT, 'Little or no credit history. >');
    expect(invalidPlaceholderValues(readPlaceholderValues(source))).toContain(
      'THIN_FILE_SHORT contains < or >',
    );
  });

  it('rejects a missing or whitespace-only value', () => {
    const missing = configSource.replace(/export const REPO_URL = '[^']*';/, '');
    expect(invalidPlaceholderValues(readPlaceholderValues(missing))).toContain(
      'REPO_URL is missing or empty',
    );

    const blank = configSource.replace(THIN_FILE_DEFINITION, '   ');
    expect(invalidPlaceholderValues(readPlaceholderValues(blank))).toContain(
      'THIN_FILE_DEFINITION is missing or empty',
    );
  });

  it('rejects [REAL URL] for REPO_URL', () => {
    const source = configSource.replace(REPO_URL, '[REAL URL]');
    const issues = invalidPlaceholderValues(readPlaceholderValues(source));
    expect(issues).toContain('REPO_URL must start with https://github.com/');
    expect(issues).toContain('REPO_URL must not contain brackets, spaces or placeholder words');
  });

  it('rejects <your-username> for REPO_URL', () => {
    const source = configSource.replace(REPO_URL, '<your-username>');
    expect(invalidPlaceholderValues(readPlaceholderValues(source)).length).toBeGreaterThan(0);
  });

  it('rejects an empty REPO_URL', () => {
    const source = configSource.replace(REPO_URL, '');
    expect(invalidPlaceholderValues(readPlaceholderValues(source))).toContain(
      'REPO_URL is missing or empty',
    );
  });

  it('accepts a valid GitHub URL for REPO_URL', () => {
    const source = configSource.replace(REPO_URL, 'https://github.com/octocat/Hello-World');
    expect(invalidPlaceholderValues(readPlaceholderValues(source))).toEqual([]);
  });

  it('accepts the current project values', () => {
    expect(invalidPlaceholderValues(readPlaceholderValues(configSource))).toEqual([]);
  });
});
