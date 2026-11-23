import { useEffect, useSyncExternalStore } from 'react';

import { getMeta } from '../api/client';
import type { Meta } from '../api/schemas';

export interface MetaState {
  meta?: Meta;
  status: 'idle' | 'loading' | 'ready' | 'error';
}

const initial: MetaState = { status: 'idle' };
let state = initial;
const listeners = new Set<() => void>();

function publish(next: MetaState) {
  state = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    // No live subscribers: drop the result so the next render starts clean.
    if (listeners.size === 0) publish(initial);
  };
}

async function load() {
  if (state.status !== 'idle') return;
  publish({ status: 'loading' });
  try {
    publish({ status: 'ready', meta: await getMeta() });
  } catch {
    publish({ status: 'error' });
  }
}

function retry() {
  publish(initial);
  return load();
}

/** One /meta request shared by the shell and every page that needs it. */
export function useMeta(): MetaState & { retry: () => void } {
  const value = useSyncExternalStore(subscribe, () => state);
  useEffect(() => {
    void load();
  }, []);
  return { ...value, retry };
}
