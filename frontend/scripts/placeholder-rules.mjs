/**
 * Pure rules behind check:placeholders. Kept separate from the CLI so the
 * release guard can be unit-tested without touching the real config file.
 */

export const PLACEHOLDER_KEYS = [
  'REPO_URL',
  'THIN_FILE_DEFINITION',
  'THIN_FILE_SHORT',
];

/** Extract the section 11 constants from a project.ts source string. */
export function readPlaceholderValues(source) {
  const values = {};
  const pattern =
    /export\s+const\s+(REPO_URL|THIN_FILE_DEFINITION|THIN_FILE_SHORT)\s*=\s*(['"])([\s\S]*?)\2/g;
  for (const match of source.matchAll(pattern)) {
    values[match[1]] = match[3];
  }
  return values;
}

/** Find values that are missing, empty, or still contain angle brackets. */
export function invalidPlaceholderValues(values) {
  const issues = [];
  for (const key of PLACEHOLDER_KEYS) {
    const value = values[key];
    if (typeof value !== 'string' || value.trim() === '') {
      issues.push(`${key} is missing or empty`);
    } else if (/[<>]/u.test(value)) {
      issues.push(`${key} contains < or >`);
    }
  }
  return issues;
}
