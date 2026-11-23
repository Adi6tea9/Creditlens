import { copy } from '../content/copy';

/** Spec 5 — thin-file gets the amber chip; thick-file is plain muted text. */
export default function FileChip({ thin }: { thin: boolean }) {
  if (thin) {
    return (
      <span className="rounded-full border border-amber-300/90 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
        {copy.report.thinFile}
      </span>
    );
  }
  return <span className="text-xs text-muted">{copy.report.thickFile}</span>;
}
