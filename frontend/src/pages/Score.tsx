import Page from '../components/Page';
import { copy } from '../content/copy';

/** Spec 6.2 — content lands in the Score task; the shell renders the H1 only. */
export default function Score() {
  return <Page title={copy.score.h1} h1={copy.score.h1} />;
}
