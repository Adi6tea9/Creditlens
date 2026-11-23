import type { Report } from '../api/schemas';
import { copy } from '../content/copy';
import { formatCount, toPercent } from '../lib/format';

type CalibrationSeries = Report['calibration'][number];
type CalibrationPoint = CalibrationSeries['points'][number];

/** Spec 6.5.1 — fixed SVG geometry. */
export const CALIBRATION_PLOT = {
  left: 56,
  right: 310,
  bottom: 195,
  top: 28,
  xAxisEnd: 325,
  yAxisStart: 20,
} as const;

const WIDTH = CALIBRATION_PLOT.right - CALIBRATION_PLOT.left; // 254
const HEIGHT = CALIBRATION_PLOT.bottom - CALIBRATION_PLOT.top; // 167

const SERIES_STYLE: Record<CalibrationSeries['key'], { color: string; label: string }> = {
  thin: { color: '#D97706', label: copy.report.thinFile },
  thick: { color: '#0D9488', label: copy.report.thickFile },
  all: { color: '#0F172A', label: copy.report.allApplicants },
};

/** Round up to the next 0.05 fraction, with a 0.1 floor (0.4 when empty). */
export function calibrationAxisMax(series: CalibrationSeries[]): number {
  const values = series.flatMap((group) =>
    group.points.flatMap((point) => [point.pred, point.obs]),
  );
  if (values.length === 0) return 0.4;
  const rounded = Math.ceil(Math.max(...values) / 0.05 - 1e-9) * 0.05;
  return Math.max(0.1, Number(rounded.toFixed(2)));
}

/** Spec 6.5.1 mapping: x = 56 + pred/axisMax × 254, y = 195 − obs/axisMax × 167. */
export function calibrationPoint(pred: number, obs: number, axisMax: number) {
  return {
    x: CALIBRATION_PLOT.left + (pred / axisMax) * WIDTH,
    y: CALIBRATION_PLOT.bottom - (obs / axisMax) * HEIGHT,
  };
}

function tickLabel(value: number): string {
  return `${Number((value * 100).toFixed(1))}%`;
}

function pointString(point: { x: number; y: number }): string {
  return `${point.x.toFixed(2)},${point.y.toFixed(2)}`;
}

export default function CalibrationChart({ series }: { series: Report['calibration'] }) {
  const plotted = series.filter((group) => group.points.length > 0);
  const axisMax = calibrationAxisMax(plotted);
  const ticks = [0, axisMax / 2, axisMax];
  const isEmpty = plotted.length === 0;

  return (
    <div className="space-y-3">
      <svg
        viewBox="0 0 360 240"
        className="mx-auto w-full max-w-md overflow-visible"
        role="img"
        aria-label={isEmpty ? copy.report.calibrationEmptyAria : copy.report.calibrationAria}
      >
        {ticks.map((tick) => {
          const x = CALIBRATION_PLOT.left + (tick / axisMax) * WIDTH;
          const y = CALIBRATION_PLOT.bottom - (tick / axisMax) * HEIGHT;
          return (
            <g key={`grid-${tick}`}>
              <line
                x1={x}
                y1={CALIBRATION_PLOT.top}
                x2={x}
                y2={CALIBRATION_PLOT.bottom}
                stroke="#F1F5F9"
                strokeWidth="1"
              />
              <line
                x1={CALIBRATION_PLOT.left}
                y1={y}
                x2={CALIBRATION_PLOT.right}
                y2={y}
                stroke="#F1F5F9"
                strokeWidth="1"
              />
            </g>
          );
        })}

        <line
          x1={CALIBRATION_PLOT.left}
          y1={CALIBRATION_PLOT.yAxisStart}
          x2={CALIBRATION_PLOT.left}
          y2={CALIBRATION_PLOT.bottom}
          stroke="#94A3B8"
          strokeWidth="1.5"
        />
        <line
          x1={CALIBRATION_PLOT.left}
          y1={CALIBRATION_PLOT.bottom}
          x2={CALIBRATION_PLOT.xAxisEnd}
          y2={CALIBRATION_PLOT.bottom}
          stroke="#94A3B8"
          strokeWidth="1.5"
        />
        <line
          x1={CALIBRATION_PLOT.left}
          y1={CALIBRATION_PLOT.bottom}
          x2={CALIBRATION_PLOT.right}
          y2={CALIBRATION_PLOT.top}
          stroke="#475569"
          strokeWidth="1.5"
          strokeDasharray="5,5"
        />

        {ticks.map((tick) => {
          const x = CALIBRATION_PLOT.left + (tick / axisMax) * WIDTH;
          const y = CALIBRATION_PLOT.bottom - (tick / axisMax) * HEIGHT;
          return (
            <g key={`tick-${tick}`}>
              <line x1={x} y1="195" x2={x} y2="200" stroke="#64748B" strokeWidth="1" />
              <line x1="51" y1={y} x2="56" y2={y} stroke="#64748B" strokeWidth="1" />
              <text x={x} y="214" textAnchor="middle" fontSize="11" fill="#475569">
                {tickLabel(tick)}
              </text>
              <text
                x="46"
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize="11"
                fill="#475569"
              >
                {tickLabel(tick)}
              </text>
            </g>
          );
        })}

        {plotted.map((group) => {
          const { color } = SERIES_STYLE[group.key];
          const points = group.points.map((point) =>
            calibrationPoint(point.pred, point.obs, axisMax),
          );
          return (
            <g key={group.key} data-series={group.key}>
              <polyline
                points={points.map(pointString).join(' ')}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinejoin="round"
              />
              {points.map((point, index) => (
                <circle
                  key={`${group.key}-${index}`}
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill={color}
                />
              ))}
            </g>
          );
        })}

        {isEmpty && (
          <text x="195" y="156" textAnchor="middle" fontSize="12" fill="#475569">
            {copy.report.calibrationEmpty}
          </text>
        )}

        <text x="190" y="234" textAnchor="middle" fontSize="11" fontWeight="500" fill="#475569">
          {copy.report.predictedRisk}
        </text>
        <text
          x="14"
          y="110"
          textAnchor="middle"
          fontSize="11"
          fontWeight="500"
          fill="#475569"
          transform="rotate(-90 14 110)"
        >
          {copy.report.observedDefaultRate}
        </text>
      </svg>

      {!isEmpty && (
        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted">
          {plotted.map((group) => {
            const { color, label } = SERIES_STYLE[group.key];
            return (
              <li key={group.key} className="inline-flex items-center gap-1.5">
                <span aria-hidden="true" className="h-0.5 w-4 rounded-full" style={{ backgroundColor: color }} />
                {label}
              </li>
            );
          })}
        </ul>
      )}

      <div className="sr-only">
        <table>
          <caption>{copy.report.calibrationAria}</caption>
          <thead>
            <tr>
              <th scope="col">Group</th>
              <th scope="col">{copy.report.performanceColumns[2]}</th>
              <th scope="col">{copy.report.observedDefaultRate}</th>
              <th scope="col">{copy.report.performanceColumns[1]}</th>
            </tr>
          </thead>
          <tbody>
            {isEmpty ? (
              <tr>
                <td colSpan={4}>{copy.report.calibrationEmpty}</td>
              </tr>
            ) : (
              plotted.flatMap((group) =>
                group.points.map((point: CalibrationPoint, index) => (
                  <tr key={`${group.key}-${index}`}>
                    <th scope="row">{SERIES_STYLE[group.key].label}</th>
                    <td>{toPercent(point.pred, 1)}</td>
                    <td>{toPercent(point.obs, 1)}</td>
                    <td>{formatCount(point.n)}</td>
                  </tr>
                )),
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
