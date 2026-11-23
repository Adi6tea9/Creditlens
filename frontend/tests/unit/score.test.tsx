import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getMeta as mockGetMeta, postScore as mockPostScore } from '../../src/api/mock';
import { copy } from '../../src/content/copy';
import Score from '../../src/pages/Score';

const mocks = vi.hoisted(() => ({
  getMeta: vi.fn(),
  postScore: vi.fn(),
  useMock: vi.fn(),
}));

vi.mock('../../src/api/client', () => ({
  getMeta: mocks.getMeta,
  postScore: mocks.postScore,
  useMock: mocks.useMock,
}));

const META_FAILURE = 'Could not load the form options. Please refresh the page and try again.';

function LocationProbe() {
  const { pathname, state } = useLocation();
  return <div data-testid="location">{`${pathname}|${JSON.stringify(state)}`}</div>;
}

async function renderScore({ waitForField = true } = {}) {
  const view = render(
    <MemoryRouter initialEntries={['/score']}>
      <Routes>
        <Route path="/score" element={<Score />} />
        <Route
          path="/score/result"
          element={
            <>
              <LocationProbe />
              <div>RESULT PAGE</div>
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
  if (waitForField) {
    await screen.findByLabelText('Loan type');
  } else {
    await screen.findByRole('heading', { level: 1, name: copy.score.h1 });
  }
  return view;
}

function fillValidForm(fields: Awaited<ReturnType<typeof mockGetMeta>>['fields']) {
  fireEvent.change(screen.getByLabelText('Loan type'), { target: { value: 'cash' } });
  for (const field of fields.filter((item) => item.type === 'number')) {
    fireEvent.change(screen.getByLabelText(field.label), { target: { value: '10' } });
  }
}

describe('Score form (spec 6.2)', () => {
  beforeEach(() => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    mocks.getMeta.mockReset().mockImplementation(mockGetMeta);
    mocks.postScore.mockReset().mockImplementation(mockPostScore);
    mocks.useMock.mockReset().mockReturnValue(false);
  });

  it('renders the nine schema fields in three groups from /meta', async () => {
    const meta = await mockGetMeta();
    await renderScore();

    expect(screen.getAllByRole('group')).toHaveLength(3);
    for (const group of copy.score.fieldsets) {
      expect(screen.getByText(group, { selector: 'legend' })).toBeInTheDocument();
    }
    for (const field of meta.fields) {
      expect(screen.getByLabelText(field.label)).toBeInTheDocument();
    }
    expect(screen.getAllByRole('spinbutton')).toHaveLength(8);
    expect(
      within(screen.getByLabelText('Loan type'))
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Loan type', 'Cash loan', 'Revolving loan']);
    expect(screen.getByText(copy.score.whatYouGetBack)).toBeInTheDocument();
    expect(screen.getByText(copy.score.goodToKnow)).toBeInTheDocument();
    expect(screen.getByText(/Provisional fields\./)).toBeInTheDocument();
    expect(screen.getByText(/Provisional options\./)).toBeInTheDocument();
  });

  it('shows the meta failure string instead of the form when /meta fails', async () => {
    mocks.getMeta.mockRejectedValue(new Error('offline'));
    const { container } = await renderScore({ waitForField: false });

    expect(screen.getByText(META_FAILURE)).toBeInTheDocument();
    expect(copy.score.metaFailure).toBe(META_FAILURE);
    expect(container.querySelector('form')).toBeNull();
    expect(screen.queryByLabelText('Loan type')).toBeNull();
  });

  it('shows the preview note only in mock mode and hides the provisional note when fields are final', async () => {
    mocks.useMock.mockReturnValue(true);
    const first = await renderScore();
    expect(screen.getByText(copy.score.previewNote)).toBeInTheDocument();
    first.unmount();

    const meta = await mockGetMeta();
    mocks.getMeta.mockResolvedValue({ ...meta, fields_final: true });
    await renderScore();
    expect(screen.queryByText(/Provisional fields\./)).not.toBeInTheDocument();
  });

  it('validates on blur using the schema minimum and the spec error text', async () => {
    await renderScore();
    const amount = screen.getByLabelText('Loan amount requested');

    fireEvent.blur(amount);
    expect(screen.getByRole('alert')).toHaveTextContent(copy.score.validationExample);
    expect(amount).toHaveAttribute('aria-invalid', 'true');
    expect(amount.getAttribute('aria-describedby')).toContain('loan_amount-error');

    fireEvent.change(amount, { target: { value: '-1' } });
    fireEvent.blur(amount);
    expect(screen.getByRole('alert')).toHaveTextContent(copy.score.validationExample);

    fireEvent.change(amount, { target: { value: '0' } });
    fireEvent.blur(amount);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('uses the schema maximum when one is supplied', async () => {
    const meta = await mockGetMeta();
    mocks.getMeta.mockResolvedValue({
      ...meta,
      fields: meta.fields.map((field) =>
        field.id === 'loan_amount' ? { ...field, max: 10 } : field,
      ),
    });
    await renderScore();
    const amount = screen.getByLabelText('Loan amount requested');

    fireEvent.change(amount, { target: { value: '11' } });
    fireEvent.blur(amount);
    expect(screen.getByRole('alert')).toHaveTextContent(copy.score.validationExample);

    fireEvent.change(amount, { target: { value: '5' } });
    fireEvent.blur(amount);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('validates on submit, focuses the first invalid field and does not call the API', async () => {
    await renderScore();
    fireEvent.click(screen.getByRole('button', { name: copy.score.estimateRisk }));

    expect(screen.getAllByRole('alert')).toHaveLength(9);
    expect(screen.getByLabelText('Loan type')).toHaveFocus();
    expect(mocks.postScore).not.toHaveBeenCalled();
  });

  it('shows the busy state and navigates with the result in router state', async () => {
    const meta = await mockGetMeta();
    const result = await mockPostScore();
    let resolveScore: (value: typeof result) => void = () => {};
    mocks.postScore.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveScore = resolve;
        }),
    );
    await renderScore();
    fillValidForm(meta.fields);

    const button = screen.getByRole('button', { name: copy.score.estimateRisk });
    fireEvent.click(button);
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveTextContent(copy.score.estimating);

    resolveScore(result);
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('/score/result'),
    );
    expect(mocks.postScore).toHaveBeenCalledWith(
      Object.fromEntries(
        meta.fields.map((field) => [
          field.id,
          field.type === 'number' ? 10 : 'cash',
        ]),
      ),
    );
  });

  it('shows an in-form alert with the server detail and keeps values on failure', async () => {
    const meta = await mockGetMeta();
    mocks.postScore.mockRejectedValue(
      Object.assign(new Error('boom'), { detail: 'Server detail here' }),
    );
    await renderScore();
    fillValidForm(meta.fields);
    const amount = screen.getByLabelText('Loan amount requested');

    const form = screen.getByRole('button', { name: copy.score.estimateRisk }).closest('form');
    fireEvent.click(screen.getByRole('button', { name: copy.score.estimateRisk }));
    await waitFor(() => expect(within(form!).getByRole('alert')).toBeInTheDocument());
    expect(within(form!).getByRole('alert')).toHaveTextContent(copy.score.submitError);
    expect(within(form!).getByRole('alert')).toHaveTextContent('Server detail here');
    expect(amount).toHaveValue(10);
    expect(screen.getByRole('button', { name: copy.score.estimateRisk })).not.toBeDisabled();
  });

  it('has no gender or age inputs and stores no values', async () => {
    const meta = await mockGetMeta();
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const pushState = vi.spyOn(window.history, 'pushState');
    await renderScore();

    const form = screen.getByRole('button', { name: copy.score.estimateRisk }).closest('form');
    expect(form).not.toBeNull();
    expect(within(form!).queryByText(/gender|age/i)).not.toBeInTheDocument();
    for (const control of form!.querySelectorAll('input, select')) {
      expect(`${control.id} ${control.getAttribute('name') ?? ''}`).not.toMatch(/gender|age/i);
    }

    fillValidForm(meta.fields);
    expect(setItem).not.toHaveBeenCalled();
    expect(pushState).not.toHaveBeenCalled();
    expect(window.location.search).toBe('');
  });
});
