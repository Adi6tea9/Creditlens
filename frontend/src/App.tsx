import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';

import Footer from './components/Footer';
import Header from './components/Header';
import TopBanner from './components/TopBanner';
import Batch from './pages/Batch';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import Report from './pages/Report';
import Result from './pages/Result';
import Score from './pages/Score';

/**
 * Spec 3 — banner, sticky header, main, footer on every route. Exported
 * without a router so unit tests can drive it with MemoryRouter.
 */
export function Shell() {
  const { pathname } = useLocation();
  return (
    <div className="flex min-h-screen flex-col">
      <TopBanner />
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {/* Spec 3 — panels fade in on route change (reduced-motion safe). */}
        <div key={pathname} className="animate-fadeSlideIn space-y-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/score" element={<Score />} />
            <Route path="/score/result" element={<Result />} />
            <Route path="/batch" element={<Batch />} />
            <Route path="/report" element={<Report />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}
