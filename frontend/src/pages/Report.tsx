import Page from '../components/Page';
import { copy } from '../content/copy';

/** Spec 6.5 — content lands in the Report task; the shell renders the H1 only. */
export default function Report() {
  return <Page title={copy.report.h1} h1={copy.report.h1} />;
}
