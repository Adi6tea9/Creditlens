import { describe, expect, it } from 'vitest';

import { csvCell, toCsv } from '../../src/lib/csv';

describe('CSV export', () => {
  it.each(['=1+1', '+1+1', '-1+1', '@SUM(A1)', '\tcmd'])(
    'prefixes the injection character in %j with an apostrophe',
    (cell) => {
      expect(csvCell(cell)).toBe(`'${cell}`);
    },
  );

  it('guards a leading CR and still quotes it per RFC 4180', () => {
    expect(csvCell('\rcmd')).toBe("\"'\rcmd\"");
  });

  it('quotes commas, quotes and newlines per RFC 4180', () => {
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('line1\nline2')).toBe('"line1\nline2"');
    expect(csvCell('\'=A,B')).toBe('"\'=A,B"');
  });

  it('joins rows with CRLF and keeps ordinary numbers unquoted', () => {
    expect(toCsv([['rank', 'risk_percent'], [1, 14.2]])).toBe(
      'rank,risk_percent\r\n1,14.2',
    );
  });
});
