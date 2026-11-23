import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getMeta as fixtureMeta, getReport as fixtureReport } from '../../src/api/mock';
import type { Meta, Report as ReportData } from '../../src/api/schemas';
import { copy } from '../../src/content/copy';
import Report from '../../src/pages/Report';

const h = vi.hoisted(() => ({
  report: null as unknown,
  meta: null as unknown,
  getReport: vi.fn(),
  getMeta: vi.fn(),
}));

vi.mock('../../src/api/client', () => ({
  getReport: () => h.getReport(),
  getMeta: () => h.getMeta(),
}));

const DASH = copy.batch.dash;

function setData(report: ReportData, meta?: Partial<Meta>) {
  h.report = report;
  h.meta = { ...(h.meta as Meta), ...meta };
}

async function renderReport() {
  render(<Report />);
  expect(
    await screen.findByRole('heading', { level: 2, name: copy.report.performanceTitle }),
  ).toBeInTheDocument();
}

function rowCells(table: HTMLElement, label: string): HTMLElement[] {
  const header = within(table).getByRole('rowheader', { name: label });
  const row = header.closest('tr') as HTMLElement;
  return within(row).getAllByRole('cell');
}

describe('Report page (spec 6.5)', () => {
  beforeEach(async () => {
    h.meta = await fixtureMeta();
    h.report = await fixtureReport();
    h.getReport.mockReset().mockImplementation(() => Promise.resolve(h.report));
    h.getMeta.mockReset().mockImplementation(() => Promise.resolve(h.meta));
  });

  it('shows only the warn banner and dashes while the model is untrained', async () => {
    setData(h.report as ReportData, {
      thin_file_definition: 'Fewer than 12 months of bureau history.',
    });
    await renderReport();

    const notes = screen.getAllByRole('note');
    expect(notes).toHaveLength(1);
    expect(notes[0].className).toContain('bg-warn-bg/80');
    expect(screen.getByText('No model has been trained yet.')).toBeInTheDocument();

    const performance = screen.getByRole('table', { name: copy.report.performanceTitle });
    for (const label of [
      copy.report.thinFile,
      copy.report.thickFile,
      copy.report.allApplicants,
    ]) {
      const cells = rowCells(performance, label);
      expect(cells).toHaveLength(7);
      cells.forEach((cell) => expect(cell).toHaveTextContent(new RegExp(`^${DASH}$`)));
    }

    const fairness = screen.getByRole('table', { name: copy.report.fairnessTitle });
    copy.report.fairnessMockRows.forEach((label) => {
      const cells = rowCells(fairness, label);
      expect(cells).toHaveLength(2);
      cells.forEach((cell) => expect(cell).toHaveTextContent(new RegExp(`^${DASH}$`)));
    });

    const chart = screen.getByRole('img', { name: copy.report.calibrationEmptyAria });
    expect(chart).toBeInTheDocument();
    expect(within(chart).getByText(copy.report.calibrationEmpty)).toBeInTheDocument();
    expect(screen.queryByText(copy.report.inconclusiveNote)).toBeNull();
    expect(screen.getByText(/Fewer than 12 months of bureau history\./)).toBeInTheDocument();
  });

  it('uses the info note, formats trained metrics, and never prints inconclusive numbers', async () => {
    setData({
      model_trained: true,
      is_sample: false,
      evaluation_note: 'Held out 20% of applications at random.',
      groups: [
        { key: 'thin', inconclusive: true, n: 999, roc_auc: 0.999 },
        {
          key: 'thick',
          n: 1234,
          default_rate: 0.125,
          roc_auc: 0.712345,
          pr_auc: 0.803,
          ks: 0.4567,
          calibration_error: 0.0123,
          auc_ci: [0.712, 0.768],
        },
        {
          key: 'all',
          n: 4321,
          default_rate: 0.1,
          roc_auc: 0.8,
          pr_auc: 0.81,
          ks: 0.45,
          calibration_error: 0.02,
          auc_ci: [0.79, 0.81],
        },
      ],
      calibration: [{ key: 'thin', points: [{ pred: 0.2, obs: 0.25, n: 100 }] }],
      fairness: [
        {
          dimension: 'By region',
          groups: [
            { label: 'North', error_rate: 0.11, calibration_gap: 0.02 },
            { label: 'South', error_rate: 0.13, calibration_gap: 0.04 },
          ],
        },
      ],
    });
    await renderReport();

    const notes = screen.getAllByRole('note');
    expect(notes).toHaveLength(1);
    expect(notes[0].className).toContain('bg-info-bg/90');
    expect(screen.getByText('Held out 20% of applications at random.')).toBeInTheDocument();
    expect(screen.queryByText('No model has been trained yet.')).toBeNull();

    const performance = screen.getByRole('table', { name: copy.report.performanceTitle });
    rowCells(performance, copy.report.thinFile).forEach((cell) => {
      expect(cell).toHaveTextContent(new RegExp(`^${copy.report.inconclusive}$`));
    });
    expect(rowCells(performance, copy.report.thickFile).map((cell) => cell.textContent)).toEqual([
      '1,234',
      '12.5%',
      '0.712',
      '0.803',
      '0.457',
      '0.012',
      '0.712–0.768',
    ]);
    expect(screen.getByText(copy.report.inconclusiveNote)).toBeInTheDocument();

    const fairness = screen.getByRole('table', { name: copy.report.fairnessTitle });
    expect(within(fairness).getByText('By region')).toBeInTheDocument();
    expect(rowCells(fairness, 'North').map((cell) => cell.textContent)).toEqual(['11.0%', '2.0%']);
    expect(rowCells(fairness, 'South').map((cell) => cell.textContent)).toEqual(['13.0%', '4.0%']);
    copy.report.fairnessMockRows.forEach((label) => {
      expect(within(fairness).queryByText(label)).toBeNull();
    });

    expect(screen.getByRole('img', { name: copy.report.calibrationAria })).toBeInTheDocument();
  });

  it('renders no banner when a trained report omits its evaluation note', async () => {
    setData({ ...(h.report as ReportData), model_trained: true, evaluation_note: '   ' });
    await renderReport();
    expect(screen.queryAllByRole('note')).toHaveLength(0);
  });
});
