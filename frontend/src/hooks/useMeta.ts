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
let active: AbortController | undefined;

function publish(next: MetaState) {
  state = next;
  listeners.forEach((listener) => listener());
}

function stop(target = active, force = false) {
  if (!target || target !== active || (!force && listeners.size > 0)) return;
  active = undefined;
  target.abort();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    // No live subscribers: cancel the shared request and start clean next time.
    if (listeners.size === 0) {
      stop(undefined, true);
      publish(initial);
    }
  };
}

function load(controller: AbortController) {
  if (state.status !== 'idle') return;
  active = controller;
  publish({ status: 'loading' });
  void getMeta(controller.signal)
    .then((meta) => {
      if (!controller.signal.aborted) publish({ status: 'ready', meta });
    })
    .catch(() => {
      if (!controller.signal.aborted) publish({ status: 'error' });
    })
    .finally(() => {
      if (active === controller) active = undefined;
    });
}

function retry() {
  stop(undefined, true);
  publish(initial);
  load(new AbortController());
}

/** One /meta request shared by the shell and every page that needs it. */
export function useMeta(): MetaState & { retry: () => void } {
  const value = useSyncExternalStore(subscribe, () => state);
  useEffect(() => {
    const controller = new AbortController();
    load(controller);
    return () => stop(controller);
  }, []);
  return { ...value, retry };
}
