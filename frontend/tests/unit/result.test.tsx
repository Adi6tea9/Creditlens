import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { getMeta as mockGetMeta, postScore as mockPostScore } from '../../src/api/mock';
import type { ResultState } from '../../src/api/types';
import { copy } from '../../src/content/copy';
import Result from '../../src/pages/Result';

async function resultState(overrides: Partial<ResultState> = {}): Promise<ResultState> {
  const meta = await mockGetMeta();
  return { ...(await mockPostScore()), thin_file_short: meta.thin_file_short, ...overrides };
}

function renderResult(state?: ResultState) {
  const entry =
    state === undefined ? '/score/result' : { pathname: '/score/result', state };
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/score" element={<p>SCORE ROUTE</p>} />
        <Route path="/score/result" element={<Result />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Result route guard (spec 6.3)', () => {
  it('redirects a direct visit without router state and never renders a result', async () => {
    renderResult();
    expect(await screen.findByText('SCORE ROUTE')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1, name: 'Result' })).toBeNull();
    expect(screen.queryByText(copy.result.estimateEyebrow)).toBeNull();
  });

  it('redirects malformed or stale state instead of rendering NaN values', async () => {
    renderResult({ from: 'score' } as unknown as ResultState);
    expect(await screen.findByText('SCORE ROUTE')).toBeInTheDocument();
  });
});

describe('Result estimate (spec 6.3)', () => {
  it('shows the sample banner, whole-percent estimate and the returned range', async () => {
    renderResult(await resultState());
    expect(screen.getByText(`${copy.result.sampleBannerLabel}.`)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Result' })).toBeInTheDocument();
    expect(screen.getByText('14%')).toBeInTheDocument();
    expect(screen.getByText('Sample range for this applicant: 10% to 19%')).toBeInTheDocument();
  });

  it('places the risk marker at 14/40 = 35% with the exact aria-label', async () => {
    renderResult(await resultState());
    const bar = screen.getByRole('img', {
      name: 'Risk scale from 0 to 40 percent with a marker at 14 percent, in the moderate band',
    });
    expect(bar).toBeInTheDocument();
    expect(screen.getByTestId('risk-marker')).toHaveStyle({ left: '35%' });
    const segments = bar.querySelectorAll('[style*="flex"]');
    expect([...segments].map((node) => (node as HTMLElement).style.flex)).toEqual([
      '25 1 0%',
      '25 1 0%',
      '50 1 0%',
    ]);
  });

  it('hides the range line when the API omits it', async () => {
    renderResult(await resultState({ range: undefined }));
    expect(screen.queryByText(/range for this applicant/i)).toBeNull();
  });

  it('uses the plain range prefix when the response is not a sample', async () => {
    renderResult(await resultState({ is_sample: false }));
    expect(screen.queryByText(`${copy.result.sampleBannerLabel}.`)).toBeNull();
    expect(screen.getByText('Range for this applicant: 10% to 19%')).toBeInTheDocument();
  });
});

describe('Thin-file card (spec 7.5)', () => {
  it('renders the spec text with thin_file_short when flagged', async () => {
    const state = await resultState();
    renderResult(state);
    const card = screen
      .getByRole('heading', { level: 2, name: copy.result.thinFileApplicant })
      .closest('[role="note"]');
    expect(card).toHaveTextContent(state.thin_file_short);
    expect(card).toHaveTextContent(copy.thinFileCardNoRangeClause);
    expect(card).not.toHaveTextContent('..');
  });

  it('drops the range clause when there is no range', async () => {
    renderResult(await resultState({ range: undefined }));
    const card = screen
      .getByRole('heading', { level: 2, name: copy.result.thinFileApplicant })
      .closest('[role="note"]');
    expect(card).not.toHaveTextContent(copy.thinFileCardNoRangeClause);
    expect(card).toHaveTextContent('so treat the estimate as less certain.');
  });

  it('does not render for a thick-file applicant', async () => {
    renderResult(await resultState({ is_thin_file: false }));
    expect(screen.queryByText(copy.result.thinFileApplicant)).toBeNull();
  });
});

describe('FactorBars (spec 6.3.2)', () => {
  it('renders the top five by absolute value, positives first, at the spec widths', async () => {
    renderResult(await resultState());
    const ids = [
      'loan_amount_vs_income',
      'bureau_history_months',
      'repayment_vs_income',
      'job_tenure_years',
      'previous_late_payments',
    ];
    expect(ids.map((id) => screen.getByTestId(`factor-bar-${id}`).style.width)).toEqual([
      '82%',
      '60%',
      '34%',
      '48%',
      '30%',
    ]);
    expect(screen.getByText('+4.1')).toBeInTheDocument();
    expect(screen.getByText('−2.4')).toBeInTheDocument();
    expect(screen.getByTestId('factor-bar-other')).toBeInTheDocument();
    expect(screen.getByText(copy.result.allOtherInputs)).toBeInTheDocument();
    expect(screen.getByText('+0.1')).toBeInTheDocument();
  });

  it('shows the reconciled panel and the footnote', async () => {
    renderResult(await resultState());
    const panel = screen.getByText(/^Average applicant/).parentElement;
    expect(panel).toHaveTextContent('Average applicant');
    expect(panel).toHaveTextContent('9.0%');
    expect(panel).toHaveTextContent('Sum of all factors');
    expect(panel).toHaveTextContent('+5.0');
    expect(panel).toHaveTextContent('This applicant');
    expect(panel).toHaveTextContent('14.0%');
    expect(screen.getByText(copy.result.factorFootnote)).toBeInTheDocument();
  });

  it('drops the word Sample from the intro for real responses', async () => {
    renderResult(await resultState({ is_sample: false }));
    expect(
      screen.getByText(
        'How each input moved the estimate away from an average applicant. Values, in percentage points.',
      ),
    ).toBeInTheDocument();
  });
});
