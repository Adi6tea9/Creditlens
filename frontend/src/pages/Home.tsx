import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { getMeta } from '../api/client';
import { PRODUCT_NAME } from '../config/project';
import { copy } from '../content/copy';

const LINK_ROUTES = ['/score', '/batch', '/report'];

/** Spec 4.1 — one colour per numbered step. */
const STEP_COLORS = [
  'border-teal-200/70 bg-teal-50 text-teal-700',
  'border-indigo-200/70 bg-indigo-50 text-indigo-700',
  'border-sky-200/70 bg-sky-50 text-sky-700',
  'border-emerald-200/70 bg-emerald-50 text-emerald-700',
];

/**
 * Spec 6.1. Owns document.title / focus / scroll because its H1 sits inside
 * the hero grid, so it cannot use Page's single top-level H1 wrapper.
 */
export default function Home() {
  const [modelTrained, setModelTrained] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const canDoId = useId();
  const howId = useId();
  const notId = useId();

  useEffect(() => {
    document.title = `${PRODUCT_NAME} — ${copy.nav.home}`;
    window.scrollTo(0, 0);
    heading.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    // A failed /meta request leaves the disclaimer visible (owner ruling).
    getMeta()
      .then((meta) => setModelTrained(meta.model_trained))
      .catch(() => undefined);
  }, []);

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 items-start gap-8 pt-2 lg:grid-cols-12 lg:gap-10">
        <div className="space-y-6 lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-border/80 bg-primary-tint px-3 py-1 text-xs font-semibold tracking-wider text-teal-800 uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {copy.home.eyebrow}
          </div>

          <h1
            ref={heading}
            tabIndex={-1}
            className="font-display text-3xl font-bold leading-[1.15] tracking-tight text-ink sm:text-4xl lg:text-[42px]"
          >
            {copy.home.h1}
          </h1>

          <p className="max-w-2xl text-base leading-relaxed text-muted sm:text-[17px]">
            {copy.home.lead}
          </p>

          <div className="flex flex-wrap items-center gap-3.5 pt-1">
            <Link
              to="/score"
              className="inline-flex min-h-touch items-center justify-center rounded-xl bg-primary-hover px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-teal-800"
            >
              {copy.home.tryDemo}
            </Link>
            <Link
              to="/report"
              className="inline-flex min-h-touch items-center justify-center rounded-xl border border-slate-300 bg-surface px-5 py-3 text-sm font-semibold text-ink shadow-sm transition-all hover:bg-slate-50"
            >
              {copy.home.readReport}
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5">
          <section
            aria-labelledby={canDoId}
            className="rounded-2xl border border-border/90 bg-surface p-6 shadow-card sm:p-7"
          >
            <h2 id={canDoId} className="mb-4 text-base font-bold text-ink">
              {copy.home.whatYouCanDo}
            </h2>
            <div className="divide-y divide-slate-100">
              {copy.home.links.map((link, index) => (
                <Link
                  key={link.title}
                  to={LINK_ROUTES[index]}
                  className="group flex items-start justify-between gap-4 py-4 first:pt-1 last:pb-1"
                >
                  <div>
                    <div className="text-sm font-semibold text-primary-text transition-colors group-hover:text-teal-800">
                      {link.title}
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{link.description}</p>
                  </div>
                  <svg
                    aria-hidden="true"
                    className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition-all group-hover:translate-x-0.5 group-hover:text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>

      <section aria-labelledby={howId} className="space-y-5 pt-2">
        <h2 id={howId} className="text-xl font-bold tracking-tight text-ink">
          {copy.home.howItWorks}
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {copy.home.steps.map((step, index) => (
            <div
              key={step.title}
              className="flex flex-col justify-between rounded-2xl border border-border/90 bg-surface p-6 shadow-card transition-shadow hover:shadow-card-hover"
            >
              <div>
                <div
                  className={`mb-4 flex h-8 w-8 items-center justify-center rounded-lg border font-bold text-xs tabular-nums ${STEP_COLORS[index]}`}
                >
                  {index + 1}
                </div>
                <h3 className="mb-2 text-base font-bold text-ink">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        aria-labelledby={notId}
        className="rounded-2xl border border-warn-border/90 bg-warn-bg/75 p-6 sm:p-7"
      >
        <h2 id={notId} className="text-lg font-bold text-ink">
          {copy.home.whatThisIsNot}
        </h2>
        <ul className="mt-4 list-disc space-y-2 pl-4 marker:text-amber">
          {copy.home.notItems
            .filter((_, index) => index !== 3 || !modelTrained)
            .map((item) => (
              <li key={item.lead} className="text-sm leading-relaxed text-body">
                <strong className="font-bold text-ink">{item.lead}</strong> {item.text}
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}
