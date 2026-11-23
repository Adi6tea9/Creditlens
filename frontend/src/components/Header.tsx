import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { copy } from '../content/copy';
import Logo from './Logo';

/** Spec 3 — active rules: /score and /score/result both activate Score. */
const NAV_ITEMS = [
  { to: '/', label: copy.nav.home, isActive: (path: string) => path === '/' },
  {
    to: '/score',
    label: copy.score.h1,
    isActive: (path: string) => path === '/score' || path.startsWith('/score/'),
  },
  { to: '/batch', label: copy.batch.h1, isActive: (path: string) => path.startsWith('/batch') },
  { to: '/report', label: copy.report.h1, isActive: (path: string) => path.startsWith('/report') },
];

export default function Header() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Selecting an item (or any route change) closes the mobile menu.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="group flex items-center gap-3">
            <Logo />
          </Link>

          <nav
            aria-label={copy.nav.primaryNav}
            className="hidden h-full items-center space-x-1 md:flex"
          >
            {NAV_ITEMS.map((item) => {
              const active = item.isActive(pathname);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={active ? 'page' : undefined}
                  className={`inline-flex h-full items-center border-b-2 px-4 text-sm ${
                    active
                      ? 'border-teal-600 font-semibold text-teal-700'
                      : 'border-transparent font-medium text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="md:hidden">
            <button
              type="button"
              aria-label={copy.nav.toggleMenu}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((open) => !open)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div
        id="mobile-menu"
        hidden={!menuOpen}
        className="space-y-1 border-b border-slate-200 bg-white px-4 pb-4 pt-2 md:hidden"
      >
        {NAV_ITEMS.map((item) => {
          const active = item.isActive(pathname);
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? 'page' : undefined}
              onClick={() => setMenuOpen(false)}
              className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm ${
                active
                  ? 'bg-teal-50 font-semibold text-teal-700'
                  : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
