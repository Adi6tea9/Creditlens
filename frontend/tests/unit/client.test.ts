import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError, getMeta, postBatch } from '../../src/api/client';
import { getMeta as mockMeta } from '../../src/api/mock';

function jsonResponse(data: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  } as unknown as Response;
}

describe('API client', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('uses the mock layer in dev by default', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const meta = await getMeta();
    expect(meta.is_sample).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('fetches from the configured base URL and validates the response', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    vi.stubEnv('VITE_API_BASE_URL', '/custom-api');
    const fetchSpy = vi.fn(async () => jsonResponse(await mockMeta()));
    vi.stubGlobal('fetch', fetchSpy);

    const meta = await getMeta();
    expect(fetchSpy).toHaveBeenCalledWith('/custom-api/meta', undefined);
    expect(meta.fields).toHaveLength(9);
  });

  it('fails loudly when a real response violates the schema', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ model_trained: 'yes' })));
    await expect(getMeta()).rejects.toThrow();
  });

  it('surfaces 422 row_errors from batch scoring', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse(
          {
            row_errors: [{ row: 14, message: 'Months of credit-bureau history must be a number.' }],
            detail: 'Invalid rows',
          },
          422,
        ),
      ),
    );

    await expect(postBatch(new File(['x'], 'a.csv'))).rejects.toMatchObject({
      status: 422,
      detail: 'Invalid rows',
      rowErrors: [{ row: 14, message: 'Months of credit-bureau history must be a number.' }],
    });
    await expect(postBatch(new File(['x'], 'a.csv'))).rejects.toBeInstanceOf(ApiError);
  });
});
