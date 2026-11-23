#!/usr/bin/env node
/**
 * Spec 12.4 — release check.
 * Greps src/ and built assets for the old section 11 placeholders, checks
 * production config for hard-coded mock labels, and rejects empty config
 * values or a REPO_URL that is not a real GitHub owner/repo URL. Exits
 * non-zero if any finding remains.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { invalidPlaceholderValues, readPlaceholderValues } from './placeholder-rules.mjs';

const root = process.cwd();
const srcDir = join(root, 'src');
const configDir = join(srcDir, 'config');
const distDir = join(root, 'dist');

function listFiles(dir) {
  if (!existsSync(dir)) return [];
  const files = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      files.push(...listFiles(path));
    } else {
      files.push(path);
    }
  }
  return files;
}

const checks = [
  {
    label: '[YOUR REPO LINK]',
    roots: [srcDir, distDir],
    pattern: /\[YOUR REPO LINK\]/g,
  },
  {
    label: '[DEFINITION',
    roots: [srcDir, distDir],
    pattern: /\[DEFINITION/g,
  },
  {
    label: 'is_sample mock label in production config',
    roots: [configDir],
    pattern: /\bis_sample\s*[:=]\s*true\b/g,
  },
];

const findings = [];

for (const check of checks) {
  const seen = new Set();
  for (const dir of check.roots) {
    for (const file of listFiles(dir)) {
      if (seen.has(file)) continue;
      seen.add(file);
      const lines = readFileSync(file, 'utf8').split(/\r?\n/);
      lines.forEach((line, index) => {
        if (check.pattern.test(line)) {
          findings.push({
            label: check.label,
            location: `${relative(root, file).replace(/\\/g, '/')}:${index + 1}`,
          });
        }
        check.pattern.lastIndex = 0;
      });
    }
  }
}

const configSource = readFileSync(join(configDir, 'project.ts'), 'utf8');
for (const issue of invalidPlaceholderValues(readPlaceholderValues(configSource))) {
  findings.push({ label: issue, location: 'src/config/project.ts' });
}

if (findings.length === 0) {
  console.log('Placeholder check passed.');
  process.exit(0);
}

console.error('Placeholder check failed. Replace the following before release:');
for (const finding of findings) {
  console.error(`  ${finding.label} -> ${finding.location}`);
}
process.exit(1);
