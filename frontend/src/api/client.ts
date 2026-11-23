import * as mock from './mock';
import {
  batchErrorSchema,
  batchSchema,
  metaSchema,
  reportSchema,
  scoreSchema,
} from './schemas';
import type { Batch, BatchError, Meta, Report, Score } from './schemas';

/** Spec 10: mock on by default in dev, off in prod; explicit env value wins. */
function useMock(): boolean {
  const raw = import.meta.env.VITE_USE_MOCK;
  return raw === undefined ? import.meta.env.DEV : raw === 'true';
}

type Parser<T> = { parse(data: unknown): T };

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly detail?: string,
    readonly rowErrors?: BatchError['row_errors'],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, parser: Parser<T>, init?: RequestInit): Promise<T> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api';
  const response = await fetch(`${baseUrl}${path}`, init);

  if (!response.ok) {
    if (response.status === 422 && path === '/score/batch') {
      const parsed = batchErrorSchema.safeParse(await response.json());
      throw new ApiError(
        'Could not score file.',
        422,
        parsed.success ? parsed.data.detail : undefined,
        parsed.success ? parsed.data.row_errors : undefined,
      );
    }
    throw new ApiError(`Request failed (${response.status})`, response.status);
  }

  return parser.parse(await response.json());
}

async function fromMock<T>(value: Promise<unknown>, parser: Parser<T>): Promise<T> {
  return parser.parse(await value);
}

export function getMeta(): Promise<Meta> {
  return useMock() ? fromMock(mock.getMeta(), metaSchema) : request('/meta', metaSchema);
}

export function postScore(values: Record<string, number | string>): Promise<Score> {
  if (useMock()) return fromMock(mock.postScore(), scoreSchema);
  return request('/score', scoreSchema, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  });
}

export function postBatch(file: File): Promise<Batch> {
  if (useMock()) return fromMock(mock.postBatch(), batchSchema);
  const form = new FormData();
  form.append('file', file);
  return request('/score/batch', batchSchema, { method: 'POST', body: form });
}

export function getReport(): Promise<Report> {
  return useMock() ? fromMock(mock.getReport(), reportSchema) : request('/report', reportSchema);
}
