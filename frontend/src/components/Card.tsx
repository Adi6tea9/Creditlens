import { useId, type ReactNode } from 'react';

interface CardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

/** Spec 5 / 4.3 — a section labelled by its heading. */
export default function Card({ title, children, className = '' }: CardProps) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className={`rounded-2xl border border-border/90 bg-surface p-6 shadow-card sm:p-7 ${className}`}
    >
      <h2 id={headingId} className="text-base font-bold">
        {title}
      </h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}
