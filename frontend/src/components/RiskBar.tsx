import { DEFAULT_APPROVE, DEFAULT_REJECT } from '../config/project';
import { copy } from '../content/copy';

/** Spec 6.3.1 — 0–40 scale, 25/25/50 segments, marker at the risk value. */
export default function RiskBar({ risk }: { risk: number }) {
  const percent = Math.min(Math.max(risk * 100, 0), 40);
  const band = percent < DEFAULT_APPROVE ? 'lower' : percent < DEFAULT_REJECT ? 'moderate' : 'higher';
  const label = `Risk scale from 0 to 40 percent with a marker at ${Number(percent.toFixed(1))} percent, in the ${band} band`;

  return (
    <div role="img" aria-label={label} className="relative pt-3.5">
      <div
        data-testid="risk-marker"
        aria-hidden="true"
        className="absolute top-0 -translate-x-1/2"
        style={{ left: `${(percent / 40) * 100}%` }}
      >
        <div className="h-0 w-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-ink" />
      </div>
      <div aria-hidden="true" className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full bg-riskbar-lower/80" style={{ flex: 25 }} />
        <div className="h-full bg-riskbar-moderate" style={{ flex: 25 }} />
        <div className="h-full bg-riskbar-higher/85" style={{ flex: 50 }} />
      </div>
      <div aria-hidden="true" className="grid grid-cols-4 gap-1 pt-1 text-xs text-slate-500">
        <span>{copy.result.riskBarLabels[0]}</span>
        <span>{copy.result.riskBarLabels[1]}</span>
        <span className="col-span-2">{copy.result.riskBarLabels[2]}</span>
      </div>
    </div>
  );
}
