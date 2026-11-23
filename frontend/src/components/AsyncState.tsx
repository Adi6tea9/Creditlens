import { copy } from '../content/copy';

const cardClass = 'rounded-2xl border border-border/90 bg-surface p-6 shadow-card sm:p-8';
const retryClass =
  'inline-flex min-h-touch items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-primary-text shadow-sm transition-colors hover:bg-slate-50';

interface RetryProps {
  onRetry: () => void;
  className?: string;
}

/** Spec 8 — skeleton blocks in the card shape, never a spinner over content. */
export function LoadingCard({
  rows = 3,
  className = cardClass,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div role="status" aria-label={copy.states.loading} aria-busy="true" className={className}>
      <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" />
      <div className="mt-5 space-y-3">
        {Array.from({ length: rows }, (_, index) => (
          <div
            key={index}
            aria-hidden="true"
            className="h-3 animate-pulse rounded bg-slate-100"
            style={{ width: `${90 - index * 10}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/** Spec 8 — in-card alert with a secondary Retry. */
export function StateError({
  onRetry,
  message = copy.states.loadError,
  className = cardClass,
}: RetryProps & { message?: string }) {
  return (
    <div role="alert" className={`${className} space-y-3`}>
      <p className="text-sm text-error">{message}</p>
      <button type="button" onClick={onRetry} className={retryClass}>
        {copy.states.retry}
      </button>
    </div>
  );
}

/** Spec 8 — /meta unreachable; static route content still renders below it. */
export function ServiceOutage({ onRetry }: Omit<RetryProps, 'className'>) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-error/40 bg-white p-8 text-center shadow-card"
    >
      <p className="text-sm font-semibold text-error">{copy.states.serviceUnavailable}</p>
      <button type="button" onClick={onRetry} className={`${retryClass} mt-4`}>
        {copy.states.retry}
      </button>
    </div>
  );
}
