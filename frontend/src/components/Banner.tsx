import type { ReactNode } from 'react';

interface BannerProps {
  variant: 'info' | 'warn';
  children: ReactNode;
}

/** Spec 5 — info carries an 8px sky dot; warn is amber. Bold lead-in lives in children. */
export default function Banner({ variant, children }: BannerProps) {
  return (
    <div
      role="note"
      className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-xs sm:text-sm ${
        variant === 'info' ? 'border-info-border bg-info-bg/90' : 'border-warn-border bg-warn-bg/80'
      }`}
    >
      {variant === 'info' && (
        <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-info-dot" />
      )}
      <div>{children}</div>
    </div>
  );
}
