import Page from '../components/Page';
import { copy } from '../content/copy';

/** Spec 6.1 — content lands in the Home task; the shell renders the H1 only. */
export default function Home() {
  return <Page title={copy.nav.home} h1={copy.home.h1} home />;
}
