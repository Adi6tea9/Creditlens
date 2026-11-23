import Page from '../components/Page';
import { copy } from '../content/copy';

/**
 * Spec 6.6 — 404 keeps banner/header/footer. The spec's home link and card
 * wrapper are deferred with the rest of the page content (H1-only shell).
 */
export default function NotFound() {
  return <Page title={copy.notFound} h1={copy.notFound} />;
}
