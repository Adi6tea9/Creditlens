import { Link } from 'react-router-dom';

import Page from '../components/Page';
import { copy } from '../content/copy';

/** Spec 6.6 — plain card with a home link; shell chrome stays intact. */
export default function NotFound() {
  return (
    <>
      <Page title={copy.notFound} h1={copy.notFound} />
      <section className="rounded-2xl border border-border/90 bg-surface p-8 shadow-card">
        <Link
          to="/"
          className="inline-flex min-h-touch items-center rounded-xl bg-primary-hover px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800"
        >
          {copy.nav.home}
        </Link>
      </section>
    </>
  );
}
