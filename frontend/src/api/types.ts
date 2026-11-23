import type { Score } from './schemas';

/** Spec 6.3 — result lives in router state, with the meta value for §7.5. */
export type ResultState = Score & { thin_file_short: string };
