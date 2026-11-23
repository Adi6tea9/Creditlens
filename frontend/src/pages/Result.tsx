import { Navigate, useLocation } from 'react-router-dom';

import Page from '../components/Page';
import { copy } from '../content/copy';

/**
 * Spec 6.3 — the result lives in router state only. A direct visit or refresh
 * (no state) redirects to /score. Content lands in the Result task.
 */
export default function Result() {
  const { state } = useLocation();
  if (!state) return <Navigate to="/score" replace />;
  return <Page title={copy.result.h1} h1={copy.result.h1} />;
}
