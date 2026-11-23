/**
 * Explicit exceptions for the spec §6–§8 → copy.ts coverage test.
 *
 * `nonCopyPatterns` classifies backtick spans that are not user-facing copy.
 * `intentionallyAbsent` lists every remaining user-facing span that is
 * deliberately not in copy.ts, with the reason. Keep both lists short and
 * justified. Strings whose wording the spec defines are NOT here: they are
 * in `specDefinedTemplates` and asserted verbatim in the coverage test.
 */

export const nonCopyPatterns = [
  { pattern: /[=<>#]/, reason: 'HTML attributes, CSS colours, constant assignments' },
  { pattern: /\b(?:GET|POST)\b/, reason: 'HTTP API calls' },
  {
    pattern: /\b[a-z][a-z0-9]*(?:-[a-z0-9.[\]/]+)+\b.*\b[a-z][a-z0-9]*(?:-[a-z0-9.[\]/]+)+\b/,
    reason: 'Tailwind class lists',
  },
  { pattern: /\d+(?:px|rem|em)\b/, reason: 'CSS lengths' },
] as const;

export const intentionallyAbsent = [
  {
    spec: 'Range for this applicant: 10% to 19%',
    reason: 'Rendered example: copy.ts holds the prefix "Range for this applicant:"; values come from the API.',
  },
  {
    spec: 'Average applicant **9.0%**',
    reason: 'Reconciliation display example; copy.ts holds the label "Average applicant".',
  },
  {
    spec: 'Sum of all factors **+5.0**',
    reason: 'Reconciliation display example; copy.ts holds the label "Sum of all factors".',
  },
  {
    spec: 'This applicant **14.0%**',
    reason: 'Reconciliation display example; copy.ts holds the label "This applicant".',
  },
  {
    spec: '2.5%–5.0%: 170 applicants',
    reason: 'Histogram bar tooltip example built from bin range and count.',
  },
  {
    spec: 'Female',
    reason: 'Example API group value; §6.5 says group values come from the API and must not be hard-coded.',
  },
  {
    spec: 'Male',
    reason: 'Example API group value; §6.5 says group values come from the API and must not be hard-coded.',
  },
  {
    spec: 'Under 30',
    reason: 'Example API group value; §6.5 says group values come from the API and must not be hard-coded.',
  },
] as const;

/** The spec defines these wordings verbatim; assert that instead of excusing them. */
export const specDefinedTemplates = [
  'Risk scale from 0 to 40 percent with a marker at {x} percent, in the {lower|moderate|higher} band',
  'Histogram of estimated risk for {n} applicants, with cutoffs at {approve} and {reject} percent',
  'Row 14: Months of credit-bureau history must be a number.',
] as const;
