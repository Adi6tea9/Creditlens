import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '../../src/api/client';
import { getMeta as fixtureMeta, postBatch as fixtureBatch } from '../../src/api/mock';
import { copy } from '../../src/content/copy';
import { MAX_FILE_BYTES } from '../../src/lib/upload';
import Batch from '../../src/pages/Batch';

const h = vi.hoisted(() => ({
  mockMode: true,
  postBatch: vi.fn(),
}));

vi.mock('../../src/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/api/client')>();
  const { getMeta: mockGetMeta } = await import('../../src/api/mock');
  return {
    ...actual,
    useMock: () => h.mockMode,
    getMeta: () => mockGetMeta(),
    postBatch: (file: File) => h.postBatch(file),
  };
});

function smallFile(name = 'applicants.csv'): File {
  return {
    name,
    size: 12,
    text: vi.fn().mockResolvedValue('loan_type\n1\n'),
  } as unknown as File;
}

function fileInput() {
  return screen.getByLabelText(copy.batch.chooseFile) as HTMLInputElement;
}

async function capturedCsvText(blobs: Blob[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blobs.at(-1)!);
  });
}

describe('Batch page (spec 6.4)', () => {
  beforeEach(() => {
    h.mockMode = true;
    h.postBatch.mockReset();
    vi.restoreAllMocks();
  });

  it('shows sample results immediately with the banner and default counts', async () => {
    render(<Batch />);

    expect(await screen.findByText(copy.batch.applicantsScoredSample)).toBeInTheDocument();
    expect(screen.getByText(copy.batch.sampleBanner.split('**')[1])).toBeInTheDocument();
    expect(screen.getByText('1,000')).toBeInTheDocument();
    expect(screen.getByText('312 thin-file (31.2%)')).toBeInTheDocument();
    expect(screen.getByText('624')).toBeInTheDocument();
    expect(screen.getByText('62.4% of file')).toBeInTheDocument();
    expect(screen.getByText('256')).toBeInTheDocument();
    expect(screen.getByText('25.6% of file')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('12.0% of file')).toBeInTheDocument();
    expect(screen.getByTestId('bar-approve')).toHaveStyle({ width: '62.4%' });
    expect(screen.getByTestId('bar-review')).toHaveStyle({ width: '25.6%' });
    expect(screen.getByTestId('bar-reject')).toHaveStyle({ width: '12%' });
  });

  it('shows only the empty state in real mode until a file is scored', () => {
    h.mockMode = false;
    render(<Batch />);
    expect(screen.getByText(copy.batch.emptyState)).toBeInTheDocument();
    expect(screen.queryByText(copy.batch.sampleBanner.split('**')[1])).toBeNull();
  });

  it('keeps reject at or above approve in every drag order', async () => {
    render(<Batch />);
    const approve = screen.getByLabelText(copy.batch.approveBelow) as HTMLInputElement;
    const reject = screen.getByLabelText(copy.batch.rejectAbove) as HTMLInputElement;

    expect([approve.value, reject.value]).toEqual(['10', '20']);
    fireEvent.change(reject, { target: { value: '5' } });
    expect(reject.value).toBe('10');
    fireEvent.change(approve, { target: { value: '30' } });
    expect([approve.value, reject.value]).toEqual(['30', '30']);
    fireEvent.change(reject, { target: { value: '12' } });
    expect(reject.value).toBe('30');
    fireEvent.change(approve, { target: { value: '1' } });
    expect([approve.value, reject.value]).toEqual(['1', '30']);
    fireEvent.change(reject, { target: { value: '10' } });
    expect(reject.value).toBe('10');
    expect(screen.getByText('1.0%')).toBeInTheDocument();
    expect(screen.getByText('10.0%')).toBeInTheDocument();
    expect(screen.queryByText('62.4% of file')).toBeNull();
  });

  it('moves counts, bar, histogram and table pills together at approve 5.5', async () => {
    const fixture = await fixtureBatch();
    render(<Batch />);
    await screen.findByText(copy.batch.applicantsScoredSample);

    const boundary = fixture.rows.find(
      (row) => row.risk * 100 > 5.5 && row.risk * 100 < 10,
    )!;
    const pageIndex = Math.floor(fixture.rows.indexOf(boundary) / 50);
    const next = screen.getByRole('button', { name: copy.batch.next });
    for (let i = 0; i < pageIndex; i += 1) fireEvent.click(next);
    expect(within(screen.getByRole('rowheader', { name: boundary.id }).closest('tr')!).getByText(copy.batch.approve)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(copy.batch.approveBelow), {
      target: { value: '5.5' },
    });

    expect(screen.getByText('352', { selector: 'div' })).toBeInTheDocument();
    expect(screen.getByText('35.2% of file')).toBeInTheDocument();
    expect(screen.getByText('528', { selector: 'div' })).toBeInTheDocument();
    expect(screen.getByText('52.8% of file')).toBeInTheDocument();
    expect(screen.getByTestId('bar-approve')).toHaveStyle({ width: '35.2%' });
    expect(screen.getByTestId('bar-review')).toHaveStyle({ width: '52.8%' });
    expect(screen.getByTestId('hist-approve-line')).toHaveStyle({ left: '13.75%' });
    expect(
      screen.getByRole('img', {
        name: 'Histogram of estimated risk for 1000 applicants, with cutoffs at 5.5 and 20.0 percent',
      }),
    ).toBeInTheDocument();
    expect(within(screen.getByRole('rowheader', { name: boundary.id }).closest('tr')!).getByText(copy.batch.review)).toBeInTheDocument();
  });

  it('paginates 50 rows at a time', async () => {
    render(<Batch />);
    await screen.findByText(copy.batch.applicantsScoredSample);
    expect(screen.getByText('Showing 1–50 of 1,000')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: copy.batch.next }));
    expect(screen.getByText('Showing 51–100 of 1,000')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: copy.batch.previous })).not.toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: copy.batch.previous }));
    expect(screen.getByText('Showing 1–50 of 1,000')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: copy.batch.previous })).toBeDisabled();
  });

  it('keeps the file chooser keyboard-reachable and visually hidden', () => {
    render(<Batch />);
    const input = fileInput();
    expect(input).toHaveAttribute('accept', '.csv');
    expect(input.className).toContain('sr-only');
    expect(input.className).not.toContain('hidden');
    input.focus();
    expect(input).toHaveFocus();
  });

  it('rejects oversized files before scoring them', async () => {
    render(<Batch />);
    const oversized = {
      name: 'huge.csv',
      size: MAX_FILE_BYTES + 1,
      text: vi.fn(),
    } as unknown as File;

    fireEvent.change(fileInput(), { target: { files: [oversized] } });

    expect(await screen.findByRole('alert')).toHaveTextContent(copy.batch.tooLarge);
    expect(screen.getByText('huge.csv')).toBeInTheDocument();
    expect(h.postBatch).not.toHaveBeenCalled();
  });

  it('shows at most 10 row errors plus the remainder count', async () => {
    h.mockMode = false;
    const errors = Array.from({ length: 12 }, (_, i) => ({
      row: i + 14,
      message: 'Months of credit-bureau history must be a number.',
    }));
    h.postBatch.mockRejectedValueOnce(
      new ApiError('Could not score file.', 422, undefined, errors),
    );
    render(<Batch />);

    fireEvent.change(fileInput(), { target: { files: [smallFile('bad.csv')] } });

    const alert = await screen.findByRole('alert');
    expect(within(alert).getAllByRole('listitem')).toHaveLength(10);
    expect(alert).toHaveTextContent('Row 14: Months of credit-bureau history must be a number.');
    expect(alert).toHaveTextContent('and 2 more');
  });

  it('downloads the template header from /meta.fields and the ranked CSV', async () => {
    const blobs: Blob[] = [];
    vi.spyOn(URL, 'createObjectURL').mockImplementation((object: Blob | MediaSource) => {
      blobs.push(object as Blob);
      return 'blob:test';
    });
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    render(<Batch />);
    await screen.findByText(copy.batch.applicantsScoredSample);

    const meta = await fixtureMeta();
    fireEvent.click(screen.getByRole('button', { name: copy.batch.downloadTemplate }));
    expect(await capturedCsvText(blobs)).toBe(meta.fields.map((field) => field.id).join(','));

    fireEvent.change(screen.getByLabelText(copy.batch.approveBelow), {
      target: { value: '5.5' },
    });
    fireEvent.click(screen.getByRole('button', { name: copy.batch.downloadRanked }));
    const csv = await capturedCsvText(blobs);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe(copy.batch.csvHeader);
    expect(lines).toHaveLength(1001);
    expect(csv).toContain(',Review,');
  });
});
