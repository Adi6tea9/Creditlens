import { Link, Navigate, useLocation } from 'react-router-dom';

import type { ResultState } from '../api/types';
import Banner from '../components/Banner';
import FactorBars from '../components/FactorBars';
import Page from '../components/Page';
import RiskBar from '../components/RiskBar';
import { copy, fill } from '../content/copy';
import { toPercent } from '../lib/format';

/** Spec 6.3 — the result lives in router state only; no fetch, no fallback. */
export default function Result() {
  const { state } = useLocation();
  const result = state as ResultState | null;
  // Stale history state must redirect too — never render invented numbers.
  if (
    !result ||
    typeof result.risk !== 'number' ||
    typeof result.base_rate !== 'number' ||
    !Array.isArray(result.contributions) ||
    typeof result.thin_file_short !== 'string'
  ) {
    return <Navigate to="/score" replace />;
  }

  // thin_file_short already ends in a period; the spec template adds another.
  const thinText = fill(copy.thinFileCard, {
    thin_file_short: result.thin_file_short.replace(/\.$/, ''),
  });
  const thinCopy = result.range
    ? thinText
    : thinText.replace(` ${copy.thinFileCardNoRangeClause}`, '');
  const range = result.range
    ? result.is_sample
      ? copy.result.sampleRangeLine.replace(
          '…',
          `${toPercent(result.range[0])} to ${toPercent(result.range[1])}`,
        )
      : `${copy.result.rangePrefix} ${toPercent(result.range[0])} to ${toPercent(result.range[1])}`
    : null;

  return (
    <>
      {result.is_sample && (
        <Banner variant="info">
          <strong>{copy.result.sampleBannerLabel}.</strong>
        </Banner>
      )}
      <Page title={copy.result.h1} h1={copy.result.h1} />

      <div className="flex flex-wrap items-start gap-6">
        <div className="min-w-0 space-y-6" style={{ flex: '1 1 400px' }}>
          <section
            aria-label={copy.result.estimateEyebrow}
            className="rounded-2xl border border-border/90 bg-surface p-8 shadow-card"
          >
            <h2 className="text-xs font-bold uppercase tracking-wider text-subtle">
              {copy.result.estimateEyebrow}
            </h2>
            <p className="mt-2 text-5xl font-extrabold tracking-tight text-ink tabular-nums">
              {toPercent(result.risk)}
            </p>
            {range && <p className="mt-2 text-sm text-muted tabular-nums">{range}</p>}
            <div className="mt-5">
              <RiskBar risk={result.risk} />
            </div>
            <p className="pt-3 text-xs text-subtle">{copy.result.bandCutoffsNote}</p>
          </section>

          {result.is_thin_file && (
            <div role="note" className="rounded-2xl border border-warn-border bg-warn-bg/80 p-6">
              <div className="flex items-center gap-2">
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-amber-500" />
                <h2 className="text-base font-bold text-ink">{copy.result.thinFileApplicant}</h2>
              </div>
              <p className="pt-2 text-sm text-body">{thinCopy}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              to="/score"
              className="inline-flex min-h-touch items-center justify-center rounded-xl bg-primary-hover px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-teal-800"
            >
              {copy.result.scoreAnother}
            </Link>
            <Link
              to="/report"
              className="inline-flex min-h-touch items-center justify-center rounded-xl border border-slate-300 bg-surface px-5 py-3 text-sm font-semibold text-ink shadow-sm transition-all hover:bg-slate-50"
            >
              {copy.result.seeReliability}
            </Link>
          </div>
        </div>

        <section
          aria-label={copy.result.whyModelSaidThis}
          className="min-w-0 rounded-2xl border border-border/90 bg-surface p-8 shadow-card"
          style={{ flex: '1.4 1 480px' }}
        >
          <FactorBars score={result} />
        </section>
      </div>
    </>
  );
}
