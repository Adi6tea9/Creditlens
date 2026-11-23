import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const frontendRoot = process.cwd();
const srcRoot = join(frontendRoot, 'src');
const repoRoot = resolve(frontendRoot, '..');
const specPath = join(repoRoot, 'docs', 'FRONTEND_MASTER_SPEC.md');
const prototypePath = join(repoRoot, 'docs', 'ui', 'creditlens_credit_risk_research_demo.html');

interface Hit {
  file: string;
  line: number;
  text: string;
}

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function findElevenPx(): Hit[] {
  return walk(srcRoot)
    .filter((path) => /\.(ts|tsx|css)$/u.test(path))
    .flatMap((path) =>
      readFileSync(path, 'utf8')
        .split(/\r?\n/u)
        .map((text, index) => ({ file: relative(srcRoot, path).replaceAll('\\', '/'), line: index + 1, text }))
        .filter(({ text }) => /text-\[11px\]|fontSize=["{]11["}]/u.test(text)),
    );
}

describe('11px audit (spec 14.1 item 11 / spec 6.5.1)', () => {
  it('allows 11px only in chart tick/title code and keeps Result eyebrow at text-xs', () => {
    const hits = findElevenPx();
    const allowed = new Set(['components/Histogram.tsx', 'components/CalibrationChart.tsx']);
    const unexpected = hits.filter(({ file }) => !allowed.has(file));

    console.log(`[11px-audit] ${hits.map(({ file, line }) => `${file}:${line}`).join(', ')}`);

    expect(unexpected).toEqual([]);
    expect(hits.some(({ file }) => file === 'components/Histogram.tsx')).toBe(true);
    expect(hits.some(({ file }) => file === 'components/CalibrationChart.tsx')).toBe(true);

    const resultSource = readFileSync(join(srcRoot, 'pages', 'Result.tsx'), 'utf8');
    expect(resultSource).not.toContain('text-[11px]');
    expect(resultSource).toContain('text-xs font-bold uppercase tracking-wider');
  });

  it('matches the spec: 6.5.1 permits chart 11px, 14.1 forbids generic 11px, prototype unchanged', () => {
    const spec = readFileSync(specPath, 'utf8');
    expect(spec).toContain('### 6.5.1');
    expect(spec).toContain('11px labels');
    expect(spec).toContain('Axis titles (11px');
    expect(spec).toContain('11px text');

    const prototype = readFileSync(prototypePath, 'utf8');
    expect(prototype.match(/text-\[11px\]/gu)).toHaveLength(4);
  });
});
