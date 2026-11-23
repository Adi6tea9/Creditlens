export type KpiTone = 'neutral' | 'approve' | 'review' | 'reject';

interface KpiTileProps {
  label: string;
  value: string | number;
  sub?: string;
  tone?: KpiTone;
}

/** Spec 5 / 4.1 — KPI tile tones. */
const TONES: Record<KpiTone, { tile: string; label: string; value: string; sub: string }> = {
  neutral: {
    tile: 'border-slate-200/90 bg-slate-50/70',
    label: 'text-slate-600',
    value: 'text-ink',
    sub: 'text-slate-500',
  },
  approve: {
    tile: 'border-teal-200/80 bg-teal-50/60',
    label: 'text-teal-800',
    value: 'text-primary-text',
    sub: 'text-slate-600',
  },
  review: {
    tile: 'border-amber-200/80 bg-amber-50/65',
    label: 'text-amber-800',
    value: 'text-amber-text',
    sub: 'text-slate-600',
  },
  reject: {
    tile: 'border-rose-200/80 bg-rose-50/60',
    label: 'text-rose-800',
    value: 'text-reject-text',
    sub: 'text-slate-600',
  },
};

export default function KpiTile({ label, value, sub, tone = 'neutral' }: KpiTileProps) {
  const t = TONES[tone];
  return (
    <div className={`space-y-1 rounded-xl border p-4 ${t.tile}`}>
      <div className={`text-xs font-semibold ${t.label}`}>{label}</div>
      <div className={`text-2xl font-extrabold tabular-nums sm:text-3xl ${t.value}`}>{value}</div>
      {sub && <div className={`text-xs ${t.sub}`}>{sub}</div>}
    </div>
  );
}
