import { useEffect, useRef } from 'react';

import { PRODUCT_NAME } from '../config/project';

interface PageProps {
  /** Title suffix: document.title becomes `CreditLens — {title}` (spec 3). */
  title: string;
  h1: string;
  /** Home uses the larger hero H1 style (spec 4.2). */
  home?: boolean;
}

/**
 * Spec 3 — per-page document.title, focus moved to the h1 on route change
 * (tabIndex -1, preventScroll), scroll to top. Pages render only their H1
 * until the page-content tasks land.
 */
export default function Page({ title, h1, home }: PageProps) {
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    document.title = `${PRODUCT_NAME} — ${title}`;
    window.scrollTo(0, 0);
    heading.current?.focus({ preventScroll: true });
  }, [title]);

  return (
    <h1
      ref={heading}
      tabIndex={-1}
      className={
        home
          ? 'font-display text-3xl font-bold leading-[1.15] tracking-tight sm:text-4xl lg:text-[42px]'
          : 'font-display text-2xl font-bold tracking-tight sm:text-3xl'
      }
    >
      {h1}
    </h1>
  );
}
