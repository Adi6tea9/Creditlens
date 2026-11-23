/** Spec 6.4.1 — 16 bins of 2.5pp from 0 to 40; the last bin also holds >= 40. */
export const BIN_COUNT = 16;
export const BIN_WIDTH = 2.5;
export const AXIS_MAX = 40;

export interface HistogramBin {
  index: number;
  start: number;
  end: number;
  count: number;
}

export function binForRisk(riskPercent: number): number {
  if (riskPercent >= AXIS_MAX) return BIN_COUNT - 1;
  if (riskPercent <= 0) return 0;
  return Math.min(BIN_COUNT - 1, Math.floor(riskPercent / BIN_WIDTH));
}

export function histogramBins(risksPercent: number[]): HistogramBin[] {
  const bins: HistogramBin[] = Array.from({ length: BIN_COUNT }, (_, i) => ({
    index: i,
    start: i * BIN_WIDTH,
    end: (i + 1) * BIN_WIDTH,
    count: 0,
  }));

  for (const risk of risksPercent) bins[binForRisk(risk)].count += 1;
  return bins;
}
