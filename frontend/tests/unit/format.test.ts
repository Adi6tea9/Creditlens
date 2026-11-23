import { describe, expect, it } from 'vitest';

import { formatCount, formatFixed, formatOrDash, toPercent } from '../../src/lib/format';

describe('display formatting', () => {
  it('converts wire fractions to percent strings', () => {
    expect(toPercent(0.14)).toBe('14%');
    expect(toPercent(0.142, 1)).toBe('14.2%');
  });

  it('adds thousands separators and fixed decimals', () => {
    expect(formatCount(50000)).toBe('50,000');
    expect(formatFixed(0.7436, 3)).toBe('0.744');
  });

  it('renders an em dash instead of inventing missing numbers', () => {
    expect(formatOrDash(undefined, (n: number) => formatFixed(n, 3))).toBe('—');
    expect(formatOrDash(null, (n: number) => formatFixed(n, 3))).toBe('—');
    expect(formatOrDash(0.5, (n: number) => formatFixed(n, 3))).toBe('0.500');
  });
});
