import { useMemo } from 'react';

import { copy } from '../content/copy';
import { AXIS_MAX, histogramBins } from '../lib/histogram';

interface HistogramProps {
  risksPercent: number[];
  approve: number;
  reject: number;
}

const TICK_POSITIONS = [0, 25, 50, 75, 100];

export default function Histogram({ risksPercent, approve, reject }: HistogramProps) {
  const bins = useMemo(() => histogramBins(risksPercent), [risksPercent]);
  const maxCount = Math.max(1, ...bins.map((bin) => bin.count));
  const label = `Histogram of estimated risk for ${risksPercent.length} applicants, with cutoffs at ${approve.toFixed(1)} and ${reject.toFixed(1)} percent`;

  return (
    <div className="space-y-1">
      <div role="img" aria-label={label}>
        <div
          aria-hidden="true"
          className="relative flex h-44 items-end gap-1.5 border-b border-slate-300 px-1"
        >
          {bins.map((bin) => {
            const midpoint = (bin.start + bin.end) / 2;
            const tone =
              midpoint < approve
                ? 'bg-teal-600'
                : midpoint > reject
                  ? 'bg-rose-600'
                  : 'border border-amber-600 bg-amber-300';
            return (
              <div
                key={bin.index}
                data-testid={`hist-bin-${bin.index}`}
                title={`${bin.start.toFixed(1)}%–${bin.end.toFixed(1)}%: ${bin.count} applicants`}
                className={`flex-1 rounded-t-md transition-[height] duration-150 ${tone}`}
                style={{ height: `${(bin.count / maxCount) * 100}%` }}
              />
            );
          })}
          <div
            data-testid="hist-approve-line"
            className="pointer-events-none absolute bottom-0 top-0 border-l-2 border-dashed border-slate-700 transition-all duration-150"
            style={{ left: `${(approve / AXIS_MAX) * 100}%` }}
          />
          <div
            data-testid="hist-reject-line"
            className="pointer-events-none absolute bottom-0 top-0 border-l-2 border-dashed border-slate-700 transition-all duration-150"
            style={{ left: `${(reject / AXIS_MAX) * 100}%` }}
          />
        </div>

        <div aria-hidden="true" className="relative mt-1.5 h-5 text-[11px] text-slate-500 tabular-nums">
          {copy.batch.axisTicks.map((tick, index) => (
            <span
              key={tick}
              className="absolute"
              style={{
                left: `${TICK_POSITIONS[index]}%`,
                transform:
                  index === 0
                    ? 'none'
                    : index === TICK_POSITIONS.length - 1
                      ? 'translateX(-100%)'
                      : 'translateX(-50%)',
              }}
            >
              {tick}
            </span>
          ))}
        </div>
        <div aria-hidden="true" className="mt-0.5 text-center text-[11px] text-slate-500">
          {copy.batch.axisTitle}
        </div>
      </div>

      <div aria-hidden="true" className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-3 text-xs text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 bg-teal-600" />
          {copy.batch.approve}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 border border-amber-600 bg-amber-300" />
          {copy.batch.review}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 bg-rose-600" />
          {copy.batch.reject}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 border-l-2 border-dashed border-slate-700" />
          {copy.batch.yourCutoffs}
        </span>
      </div>

      <table className="sr-only">
        <caption>{copy.batch.riskDistribution}</caption>
        <tbody>
          {bins.map((bin) => (
            <tr key={bin.index}>
              <th scope="row">
                {bin.start.toFixed(1)}%–{bin.end.toFixed(1)}%
              </th>
              <td>{bin.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
