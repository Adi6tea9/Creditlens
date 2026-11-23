import { describe, expect, it, vi } from 'vitest';

import { exceedsUploadLimits, MAX_FILE_BYTES, MAX_ROWS } from '../../src/lib/upload';

function fakeFile(text: string, size = text.length): File {
  return { name: 'applicants.csv', size, text: vi.fn().mockResolvedValue(text) } as unknown as File;
}

describe('upload guard (spec 6.4)', () => {
  it('rejects a file over 50 MB before reading it', async () => {
    const file = fakeFile('id\n1', MAX_FILE_BYTES + 1);
    expect(await exceedsUploadLimits(file)).toBe(true);
    expect(file.text).not.toHaveBeenCalled();
  });

  it('accepts exactly 100,000 data rows', async () => {
    const text = ['id', ...Array.from({ length: MAX_ROWS }, (_, i) => i)].join('\n');
    expect(await exceedsUploadLimits(fakeFile(text))).toBe(false);
  });

  it('rejects 100,001 data rows and handles CRLF', async () => {
    const text = ['id', ...Array.from({ length: MAX_ROWS + 1 }, (_, i) => i)].join('\r\n');
    expect(await exceedsUploadLimits(fakeFile(text))).toBe(true);
  });

  it('ignores blank trailing lines when counting', async () => {
    const text = ['id', ...Array.from({ length: MAX_ROWS }, (_, i) => i)].join('\n') + '\n\n';
    expect(await exceedsUploadLimits(fakeFile(text))).toBe(false);
  });
});
