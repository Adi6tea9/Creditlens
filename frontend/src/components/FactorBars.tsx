import type { Score } from '../api/schemas';
import { copy } from '../content/copy';
import { factorBarWidth, reconcileScore } from '../lib/reconcile';
import { toPercent } from '../lib/format';

const signed = (value: number) => `${value < 0 ? '−' : '+'}${Math.abs(value).toFixed(1)}`;

/** Spec 6.3.2 — top five signed SHAP bars plus a reconciling "other" row. */
export default function FactorBars({ score }: { score: Score }) {
  const { top5, other, basePp, riskPp } = reconcileScore(score);
  const maxAbsShown = Math.max(5, ...top5.map((factor) => Math.abs(factor.value_pp)));
  const intro = score.is_sample
    ? copy.result.factorIntro
    : copy.result.factorIntro.replace('Sample values', 'Values');

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="text-lg font-bold text-ink">{copy.result.whyModelSaidThis}</h2>
        <p className="text-sm text-muted">{intro}</p>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted">
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="inline-block h-3 w-3 rounded-[2px] bg-amber-600" />
          {copy.result.raisesEstimate}
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="inline-block h-3 w-3 rounded-[2px] bg-teal-600" />
          {copy.result.lowersEstimate}
        </span>
      </div>

      <div className="space-y-3 pt-1">
        {top5.map((factor) => {
          const positive = factor.value_pp >= 0;
          const bar = (
            <div
              className={`h-4 ${positive ? 'rounded-r-md bg-amber-600' : 'rounded-l-md bg-teal-600'}`}
              style={{ width: `${factor.width}%` }}
              data-testid={`factor-bar-${factor.feature}`}
            />
          );
          return (
            <div className="grid grid-cols-12 items-center gap-3" key={factor.feature}>
              <span
                className="col-span-5 truncate text-sm font-medium text-ink sm:col-span-4"
                title={factor.label}
              >
                {factor.label}
              </span>
              <div className="col-span-5 flex items-center sm:col-span-6">
                <div className={`flex w-1/2 ${positive ? '' : 'justify-end'}`}>
                  {positive ? null : bar}
                </div>
                <div aria-hidden="true" className="h-6 w-0.5 shrink-0 bg-slate-800" />
                <div className="flex w-1/2">{positive ? bar : null}</div>
              </div>
              <span
                className={`col-span-2 text-right text-sm font-bold tabular-nums ${
                  positive ? 'text-amber-text' : 'text-primary-text'
                }`}
              >
                {signed(factor.value_pp)}
              </span>
            </div>
          );
        })}

        <div className="grid grid-cols-12 items-center gap-3 pt-1">
          <span
            className="col-span-5 truncate text-xs text-muted sm:col-span-4 sm:text-sm"
            title={copy.result.allOtherInputs}
          >
            {copy.result.allOtherInputs}
          </span>
          <div className="col-span-5 flex items-center sm:col-span-6">
            <div className="w-1/2" />
            <div aria-hidden="true" className="h-5 w-0.5 shrink-0 bg-slate-300" />
            <div className="flex w-1/2">
              <div
                className="h-3 rounded-r-[2px] bg-slate-400"
                style={{ width: `${factorBarWidth(other, maxAbsShown)}%` }}
                data-testid="factor-bar-other"
              />
            </div>
          </div>
          <span className="col-span-2 text-right text-xs font-semibold tabular-nums text-muted sm:text-sm">
            {signed(other)}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-bg px-4 py-3.5 text-xs tabular-nums text-muted sm:text-sm">
        <span>
          {copy.result.reconciliationLabels.average}{' '}
          <strong className="font-bold text-ink">{toPercent(score.base_rate, 1)}</strong>
        </span>
        <span>
          {copy.result.reconciliationLabels.sumFactors}{' '}
          <strong className="font-bold text-ink">{signed(riskPp - basePp)}</strong>
        </span>
        <span>
          {copy.result.reconciliationLabels.thisApplicant}{' '}
          <strong className="font-bold text-ink">{toPercent(score.risk, 1)}</strong>
        </span>
      </div>

      <p className="text-xs text-subtle">{copy.result.factorFootnote}</p>
    </div>
  );
}
