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

const GITHUB_PREFIX = 'https://github.com/';

/** REPO_URL must be a real GitHub owner/repo URL, not a template. */
function repoUrlIssues(value) {
  const issues = [];
  if (!value.startsWith(GITHUB_PREFIX)) {
    issues.push('REPO_URL must start with https://github.com/');
  } else {
    const segments = value.slice(GITHUB_PREFIX.length).split('/');
    if (segments.length < 2 || segments.some((segment) => segment.length === 0)) {
      issues.push('REPO_URL must have an owner and a repo segment');
    }
  }
  if (/[[\]<>]/u.test(value) || /\s/u.test(value) || /\b(?:your|real|repo-name)\b/iu.test(value)) {
    issues.push('REPO_URL must not contain brackets, spaces or placeholder words');
  }
  return issues;
}

/** Find values that are missing, empty, bracketed, or a malformed repo URL. */
export function invalidPlaceholderValues(values) {
  const issues = [];
  for (const key of PLACEHOLDER_KEYS) {
    const value = values[key];
    if (typeof value !== 'string' || value.trim() === '') {
      issues.push(`${key} is missing or empty`);
    } else if (/[<>]/u.test(value)) {
      issues.push(`${key} contains < or >`);
    } else if (key === 'REPO_URL') {
      issues.push(...repoUrlIssues(value));
    }
  }
  return issues;
}
