import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import App, { Shell } from '../../src/App';
import { getMeta as mockGetMeta, postScore as mockPostScore } from '../../src/api/mock';
import { PRODUCT_NAME } from '../../src/config/project';
import { copy, fill, placeholderDefaults } from '../../src/content/copy';

function renderShell(path: string, state?: unknown) {
  return render(
    <MemoryRouter initialEntries={[state ? { pathname: path, state } : path]}>
      <Shell />
    </MemoryRouter>,
  );
}

async function resultState() {
  return {
    ...(await mockPostScore()),
    thin_file_short: (await mockGetMeta()).thin_file_short,
  };
}

function primaryNav() {
  return screen.getByRole('navigation', { name: copy.nav.primaryNav });
}

beforeEach(() => {
  // jsdom does not implement scrolling; assert the call instead.
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
});

describe('shell: navigation', () => {
  it('renders every nav item as a link with an href', () => {
    renderShell('/');
    const links = within(primaryNav()).getAllByRole('link');
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/',
      '/score',
      '/batch',
      '/report',
    ]);
    expect(links.map((a) => a.textContent)).toEqual([
      copy.nav.home,
      copy.score.h1,
      copy.batch.h1,
      copy.report.h1,
    ]);
    for (const link of links) expect(link.tagName).toBe('A');
  });

  it.each([
    ['/', copy.nav.home],
    ['/score', copy.score.h1],
    ['/batch', copy.batch.h1],
    ['/report', copy.report.h1],
  ])('marks the active tab with aria-current on %s', (path, label) => {
    renderShell(path);
    const nav = primaryNav();
    expect(within(nav).getByRole('link', { name: label })).toHaveAttribute(
      'aria-current',
      'page',
    );
    for (const other of within(nav).getAllByRole('link')) {
      if (other.textContent !== label) expect(other).not.toHaveAttribute('aria-current');
    }
  });

  it('activates Score on /score/result (spec 3 active rules)', async () => {
    renderShell('/score/result', await resultState());
    expect(
      within(primaryNav()).getByRole('link', { name: copy.score.h1 }),
    ).toHaveAttribute('aria-current', 'page');
  });
});

describe('shell: banner and footer on every route', () => {
  it.each(['/', '/score', '/batch', '/report', '/no-such-page'])(
    'shows the research banner on %s',
    (path) => {
      renderShell(path);
      expect(screen.getByRole('note')).toHaveTextContent(copy.topBanner);
    },
  );

  it('shows the research banner on /score/result', async () => {
    renderShell('/score/result', await resultState());
    expect(screen.getByText(copy.topBanner)).toBeInTheDocument();
  });

  it('renders the footer copy with the repo placeholder', () => {
    renderShell('/');
    expect(document.querySelector('footer')?.textContent).toBe(
      fill(copy.footer, placeholderDefaults),
    );
  });
});

describe('shell: titles, focus and scroll', () => {
  it.each([
    ['/', 'Home'],
    ['/score', 'Score an applicant'],
    ['/batch', 'Batch scoring'],
    ['/report', 'Model report'],
    ['/no-such-page', 'Page not found'],
  ])('sets document.title on %s', (path, suffix) => {
    renderShell(path);
    expect(document.title).toBe(`${PRODUCT_NAME} — ${suffix}`);
  });

  it('sets the Result title when reached with state', async () => {
    renderShell('/score/result', await resultState());
    expect(document.title).toBe(`${PRODUCT_NAME} — ${copy.result.h1}`);
  });

  it('moves focus to the h1 on load', () => {
    renderShell('/score');
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveAttribute('tabindex', '-1');
    expect(document.activeElement).toBe(h1);
  });

  it('moves focus to the new h1 on route change', async () => {
    const user = userEvent.setup();
    renderShell('/');
    await user.click(within(primaryNav()).getByRole('link', { name: copy.batch.h1 }));
    await waitFor(() => {
      const h1 = screen.getByRole('heading', { level: 1, name: copy.batch.h1 });
      expect(document.activeElement).toBe(h1);
    });
  });

  it('scrolls to top on page mount', () => {
    renderShell('/');
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });
});

describe('shell: mobile menu', () => {
  it('toggles with aria-expanded/aria-controls and closes on selection', async () => {
    const user = userEvent.setup();
    renderShell('/');
    const toggle = screen.getByRole('button', { name: copy.nav.toggleMenu });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-controls', 'mobile-menu');
    const menu = document.getElementById('mobile-menu');
    expect(menu).not.toBeNull();
    expect(menu).toHaveAttribute('hidden');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(menu).not.toHaveAttribute('hidden');

    await user.click(within(menu as HTMLElement).getByRole('link', { name: copy.batch.h1 }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(copy.batch.h1);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(menu).toHaveAttribute('hidden');
  });
});

describe('shell: Result guard (spec 6.3)', () => {
  it('redirects a stateless /score/result visit to /score', () => {
    renderShell('/score/result');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(copy.score.h1);
    expect(document.title).toBe(`${PRODUCT_NAME} — ${copy.score.h1}`);
  });

  it('renders Result when router state is present', async () => {
    renderShell('/score/result', await resultState());
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(copy.result.h1);
  });
});

describe('shell: history', () => {
  it.each(['/batch', '/report', '/'])('direct visit to %s keeps its page (refresh equivalent)', (path) => {
    renderShell(path);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(document.querySelector('footer')).not.toBeNull();
  });

  // Uses the real BrowserRouter + window.history; kept last because it moves
  // the shared jsdom URL.
  it('back button returns to the previous page', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(within(primaryNav()).getByRole('link', { name: copy.score.h1 }));
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(copy.score.h1),
    );
    window.history.back();
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(copy.home.h1),
    );
  });
});
