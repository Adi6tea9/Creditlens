import { StrictMode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { getMeta } from '../../src/api/client';
import { getMeta as mockGetMeta } from '../../src/api/mock';
import { useMeta } from '../../src/hooks/useMeta';

vi.mock('../../src/api/client', () => ({ getMeta: vi.fn() }));

function Harness() {
  const { meta, status } = useMeta();
  return (
    <>
      <span data-testid="meta-status">{status}</span>
      <span data-testid="meta-value">{meta?.thin_file_short ?? 'none'}</span>
    </>
  );
}

describe('useMeta (spec 8)', () => {
  it('unmount/remount aborts the stale /meta request and keeps newer state', async () => {
    const base = await mockGetMeta();
    const stale = { ...base, thin_file_short: 'stale' };
    const fresh = { ...base, thin_file_short: 'fresh' };
    const signals: AbortSignal[] = [];
    let resolveStale: (value: typeof stale) => void = () => {};
    const stalePromise = new Promise<typeof stale>((resolve) => {
      resolveStale = resolve;
    });

    vi.mocked(getMeta).mockImplementation((signal) => {
      expect(signal).toBeDefined();
      signals.push(signal as AbortSignal);
      return signals.length === 1 ? stalePromise : Promise.resolve(fresh);
    });

    render(
      <StrictMode>
        <Harness />
      </StrictMode>,
    );

    expect(signals).toHaveLength(2);
    expect(signals[0].aborted).toBe(true);
    await screen.findByText('fresh');

    // A late response from the discarded request must not overwrite newer data.
    resolveStale(stale);
    await Promise.resolve();
    expect(screen.getByTestId('meta-value')).toHaveTextContent('fresh');
    expect(screen.getByTestId('meta-status')).toHaveTextContent('ready');
  });
});
