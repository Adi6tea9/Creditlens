import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getMeta } from '../../src/api/client';
import type { Meta } from '../../src/api/schemas';
import { copy } from '../../src/content/copy';
import Home from '../../src/pages/Home';

vi.mock('../../src/api/client', () => ({ getMeta: vi.fn() }));

const meta = vi.mocked(getMeta);
const asMeta = (model_trained: boolean) => ({ model_trained }) as unknown as Meta;

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  meta.mockReset();
  meta.mockResolvedValue(asMeta(false));
});

describe('Home (spec 6.1)', () => {
  it('renders the hero, link card, steps and warnings from copy.ts', async () => {
    renderHome();

    expect(document.title).toBe(`CreditLens — ${copy.nav.home}`);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(copy.home.h1);
    expect(screen.getByText(copy.home.eyebrow)).toBeInTheDocument();
    expect(screen.getByText(copy.home.lead)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: copy.home.tryDemo })).toHaveAttribute('href', '/score');
    expect(screen.getByRole('link', { name: copy.home.readReport })).toHaveAttribute('href', '/report');

    expect(screen.getByRole('heading', { name: copy.home.whatYouCanDo })).toBeInTheDocument();
    const routes = ['/score', '/batch', '/report'];
    copy.home.links.forEach((link, index) => {
      expect(screen.getByText(link.title).closest('a')).toHaveAttribute('href', routes[index]);
      expect(screen.getByText(link.description)).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { name: copy.home.howItWorks })).toBeInTheDocument();
    copy.home.steps.forEach((step) => {
      expect(screen.getByRole('heading', { name: step.title })).toBeInTheDocument();
      expect(screen.getByText(step.text)).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { name: copy.home.whatThisIsNot })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(copy.home.notItems[3].lead)).toBeInTheDocument());
    copy.home.notItems.forEach((item) => {
      expect(screen.getByText(item.lead)).toBeInTheDocument();
      expect(screen.getByText(item.text)).toBeInTheDocument();
    });
  });

  it('hides the "Not trained yet." bullet when model_trained is true', async () => {
    meta.mockResolvedValue(asMeta(true));
    renderHome();
    await waitFor(() => expect(meta).toHaveBeenCalled());

    expect(screen.queryByText(copy.home.notItems[3].lead)).not.toBeInTheDocument();
    expect(screen.getByText(copy.home.notItems[0].lead)).toBeInTheDocument();
  });

  it('keeps the "Not trained yet." bullet when /meta fails', async () => {
    meta.mockRejectedValue(new Error('offline'));
    renderHome();
    await waitFor(() => expect(meta).toHaveBeenCalled());

    expect(screen.getByText(copy.home.notItems[3].lead)).toBeInTheDocument();
  });
});
