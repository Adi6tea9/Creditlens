import Page from '../components/Page';
import { copy } from '../content/copy';

/** Spec 6.4 — content lands in the Batch task; the shell renders the H1 only. */
export default function Batch() {
  return <Page title={copy.batch.h1} h1={copy.batch.h1} />;
}
