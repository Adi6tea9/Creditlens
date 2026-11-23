import { copy } from '../content/copy';

/** Spec 4.1 / 5 — band pills; colour is never the only carrier (text label). */
const BANDS = {
  Approve: { label: copy.batch.approve, className: 'border-teal-200 bg-teal-50 text-teal-800' },
  Review: { label: copy.batch.review, className: 'border-amber-200 bg-amber-100/90 text-amber-800' },
  Reject: { label: copy.batch.reject, className: 'border-rose-200 bg-rose-50 text-rose-800' },
} as const;

export type Band = keyof typeof BANDS;

export default function BandPill({ band }: { band: Band }) {
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${BANDS[band].className}`}
    >
      {BANDS[band].label}
    </span>
  );
}
