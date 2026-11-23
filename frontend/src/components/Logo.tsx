import { PRODUCT_NAME } from '../config/project';

/** Spec 4.4 — the CreditLens mark, copied exactly. */
export default function Logo() {
  return (
    <span className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-logo-from via-logo-via to-logo-to text-white shadow-sm ring-1 ring-inset ring-white/20 transition-all duration-200 group-hover:scale-[1.03] group-hover:shadow-md">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11.5" cy="11.5" r="7.5" stroke="currentColor" strokeWidth="1.85" strokeOpacity="0.92" />
          <path d="M17 17L20.5 20.5" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
          <rect x="8.25" y="12.25" width="1.7" height="3.25" rx="0.85" fill="currentColor" fillOpacity="0.75" />
          <rect x="10.75" y="9.75" width="1.7" height="5.75" rx="0.85" fill="currentColor" fillOpacity="0.9" />
          <rect x="13.25" y="7.5" width="1.7" height="8" rx="0.85" fill="#A7F3D0" />
        </svg>
      </span>
      {/* Hard rule 6: the name comes from PRODUCT_NAME only. "Credit" in ink,
          "Lens" in teal-700 (spec 4.2 wordmark). */}
      <span className="font-display text-[17px] font-bold tracking-tight text-slate-900">
        {PRODUCT_NAME.slice(0, -4)}
        <span className="text-teal-700">{PRODUCT_NAME.slice(-4)}</span>
      </span>
    </span>
  );
}
