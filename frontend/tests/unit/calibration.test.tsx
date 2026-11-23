import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { Report } from '../../src/api/schemas';
import CalibrationChart, {
  calibrationAxisMax,
  calibrationPoint,
} from '../../src/components/CalibrationChart';
import { copy } from '../../src/content/copy';

const series: Report['calibration'] = [
  { key: 'thin', points: [{ pred: 0.2, obs: 0.3, n: 100 }] },
  { key: 'thick', points: [{ pred: 0.4, obs: 0.35, n: 200 }] },
  { key: 'all', points: [{ pred: 0.24, obs: 0.28, n: 300 }] },
];

describe('CalibrationChart (spec 6.5.1)', () => {
  it('rounds the shared axis up to the next 0.05, with a 0.1 floor', () => {
    expect(calibrationAxisMax([])).toBe(0.4);
    expect(calibrationAxisMax([{ key: 'all', points: [{ pred: 0, obs: 0.01, n: 1 }] }])).toBe(0.1);
    expect(calibrationAxisMax([{ key: 'all', points: [{ pred: 0.37, obs: 0.3, n: 1 }] }])).toBe(0.4);
    expect(calibrationAxisMax([{ key: 'all', points: [{ pred: 0.41, obs: 0.3, n: 1 }] }])).toBe(0.45);
  });

  it('maps predicted and observed fractions onto the exact plot area', () => {
    const mid = calibrationPoint(0.2, 0.3, 0.4);
    expect(mid.x).toBeCloseTo(56 + (0.2 / 0.4) * 254);
    expect(mid.y).toBeCloseTo(195 - (0.3 / 0.4) * 167);

    const topRight = calibrationPoint(0.4, 0.4, 0.4);
    expect(topRight.x).toBeCloseTo(310);
    expect(topRight.y).toBeCloseTo(28);

    const origin = calibrationPoint(0, 0, 0.4);
    expect(origin.x).toBe(56);
    expect(origin.y).toBe(195);
  });

  it('draws the three API series with the specified colours and hidden point table', () => {
    const { container } = render(<CalibrationChart series={series} />);
    const groups = [...container.querySelectorAll('g[data-series]')];
    expect(groups.map((group) => group.getAttribute('data-series'))).toEqual([
      'thin',
      'thick',
      'all',
    ]);
    expect(groups.map((group) => group.querySelector('circle')?.getAttribute('fill'))).toEqual([
      '#D97706',
      '#0D9488',
      '#0F172A',
    ]);
    expect(groups[0].querySelector('polyline')).toHaveAttribute('points', '183.00,69.75');
    expect(groups[0].querySelector('circle')).toHaveAttribute('r', '4');

    const table = screen.getByRole('table');
    expect(within(table).getByText('20.0%')).toBeInTheDocument();
    expect(within(table).getByText('30.0%')).toBeInTheDocument();
    expect(within(table).getByText('100')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: copy.report.calibrationAria })).toBeInTheDocument();
  });

  it('keeps the empty axes and diagonal, and hides an empty point table', () => {
    const { container } = render(<CalibrationChart series={[]} />);
    const chart = screen.getByRole('img', { name: copy.report.calibrationEmptyAria });
    expect(chart).toBeInTheDocument();
    expect(within(chart).getByText(copy.report.calibrationEmpty)).toBeInTheDocument();
    expect(screen.getAllByText('20%')).toHaveLength(2);
    expect(container.querySelector('polyline')).toBeNull();
    expect(container.querySelector('line[stroke-dasharray="5,5"]')).toHaveAttribute('x1', '56');
    expect(container.querySelector('line[stroke-dasharray="5,5"]')).toHaveAttribute('x2', '310');
    expect(within(screen.getByRole('table')).getByText(copy.report.calibrationEmpty)).toBeInTheDocument();
  });
});
