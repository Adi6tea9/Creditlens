import { useEffect, useState, type ReactNode } from 'react';

import { getMeta, getReport } from '../api/client';
import type { Report as ReportData } from '../api/schemas';
import Banner from '../components/Banner';
import CalibrationChart from '../components/CalibrationChart';
import DataTable from '../components/DataTable';
import Page from '../components/Page';
import { copy, fill, placeholderDefaults } from '../content/copy';
import { formatCount, toPercent } from '../lib/format';

type GroupKey = ReportData['groups'][number]['key'];
type ReportGroup = ReportData['groups'][number];

const DASH = copy.batch.dash;
const FIXED_3 = (value: number) => value.toFixed(3);

const GROUP_ORDER: Array<{ key: GroupKey; label: string; dot: string; rowClass: string }> = [
  { key: 'thin', label: copy.report.thinFile, dot: 'bg-amber', rowClass: '' },
  { key: 'thick', label: copy.report.thickFile, dot: 'bg-primary', rowClass: '' },
  {
    key: 'all',
    label: copy.report.allApplicants,
    dot: 'bg-ink',
    rowClass: 'bg-thead/40',
  },
];

function BoldLead({ text }: { text: string }) {
  const match = /^\*\*(.+?)\*\*\s*(.*)$/.exec(text);
  if (!match) return <>{text}</>;
  return (
    <>
      <strong className="font-semibold">{match[1]}</strong> {match[2]}
    </>
  );
}

function metricCell<T>(value: T | undefined, format: (value: T) => string): ReactNode {
  return value === undefined ? <span className="text-subtle">{DASH}</span> : format(value);
}

function performanceCells(group: ReportGroup | undefined, trained: boolean): ReactNode[] {
  if (!trained) {
    return Array.from({ length: 7 }, () => <span className="text-subtle">{DASH}</span>);
  }
  if (group?.inconclusive) {
    return Array.from({ length: 7 }, () => (
      <span className="text-subtle">{copy.report.inconclusive}</span>
    ));
  }
  if (!group) {
    return Array.from({ length: 7 }, () => <span className="text-subtle">{DASH}</span>);
  }
  return [
    metricCell(group.n, formatCount),
    metricCell(group.default_rate, (value) => toPercent(value, 1)),
    metricCell(group.roc_auc, FIXED_3),
    metricCell(group.pr_auc, FIXED_3),
    metricCell(group.ks, FIXED_3),
    metricCell(group.calibration_error, FIXED_3),
    metricCell(group.auc_ci, ([low, high]) => `${FIXED_3(low)}–${FIXED_3(high)}`),
  ];
}

function groupLabelCell(label: string, dot: string): ReactNode {
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

function FairnessTable({ fairness, trained }: { fairness: ReportData['fairness']; trained: boolean }) {
  const dash = <span className="text-subtle">{DASH}</span>;
  const cell = 'px-4 py-3.5 text-right text-xs sm:text-sm';
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/90">
      <table className="w-full min-w-[360px] divide-y divide-slate-200 text-xs sm:text-sm">
        <caption className="sr-only">{copy.report.fairnessTitle}</caption>
        <thead className="bg-thead/90">
          <tr>
            {copy.report.fairnessColumns.map((column, index) => (
              <th
                key={column}
                scope="col"
                className={`px-4 py-3 text-xs font-semibold text-slate-500 ${
                  index === 0 ? 'text-left' : 'text-right'
                }`}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        {fairness.length > 0 ? (
          fairness.map((dimension) => (
            <tbody key={dimension.dimension} className="divide-y divide-slate-100 bg-white">
              <tr className="bg-thead/60">
                <th
                  scope="rowgroup"
                  colSpan={3}
                  className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700"
                >
                  {dimension.dimension}
                </th>
              </tr>
              {dimension.groups.map((group) => (
                <tr key={group.label} className="hover:bg-slate-50/70">
                  <th scope="row" className="px-4 py-3.5 pl-8 text-left text-xs font-medium sm:text-sm">
                    {group.label}
                  </th>
                  <td className={cell}>
                    {trained ? metricCell(group.error_rate, (value) => toPercent(value, 1)) : dash}
                  </td>
                  <td className={cell}>
                    {trained ? metricCell(group.calibration_gap, (value) => toPercent(value, 1)) : dash}
                  </td>
                </tr>
              ))}
            </tbody>
          ))
        ) : (
          <tbody className="divide-y divide-slate-100 bg-white">
            {copy.report.fairnessMockRows.map((label) => (
              <tr key={label} className="hover:bg-slate-50/70">
                <th scope="row" className="px-4 py-3.5 text-left text-xs font-medium sm:text-sm">
                  {label}
                </th>
                <td className={cell}>{dash}</td>
                <td className={cell}>{dash}</td>
              </tr>
            ))}
          </tbody>
        )}
      </table>
    </div>
  );
}

/** Spec 6.5 — nothing on this page is a result until /report says it is. */
export default function Report() {
  const [report, setReport] = useState<ReportData>();
  const [loadError, setLoadError] = useState<string>();
  const [thinDefinition, setThinDefinition] = useState<string>(
    placeholderDefaults.thin_file_definition,
  );

  useEffect(() => {
    let active = true;
    getReport()
      .then((data) => {
        if (active) setReport(data);
      })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : 'Request failed');
      });
    getMeta()
      .then((data) => {
        if (active) setThinDefinition(data.thin_file_definition);
      })
      .catch(() => {
        // The thin-file definition falls back to the config value.
      });
    return () => {
      active = false;
    };
  }, []);

  const trained = report?.model_trained === true;
  const note = report?.evaluation_note?.trim();
  const inconclusive =
    report?.model_trained === true && report.groups.some((group) => group.inconclusive === true);

  return (
    <>
      <Page title={copy.report.h1} h1={copy.report.h1} />
      <p className="text-sm sm:text-base text-muted">{copy.report.lead}</p>

      {loadError && (
        <p role="alert" className="rounded-xl border border-error/30 bg-white p-4 text-sm text-error">
          {loadError}
        </p>
      )}

      {report && (
        <>
          {!trained ? (
            <Banner variant="warn">
              <BoldLead text={copy.report.untrainedBanner} />
            </Banner>
          ) : (
            note && <Banner variant="info">{note}</Banner>
          )}

          <section
            aria-labelledby="report-performance-title"
            className="rounded-2xl border border-border/90 bg-surface p-8 shadow-card"
          >
            <h2
              id="report-performance-title"
              className="font-display text-xl font-bold leading-7 text-ink"
            >
              {copy.report.performanceTitle}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-muted">{copy.report.performanceHelper}</p>
            <div className="mt-4">
              <DataTable
                columns={[...copy.report.performanceColumns]}
                rows={GROUP_ORDER.map((definition) => [
                  groupLabelCell(definition.label, definition.dot),
                  ...performanceCells(
                    report.groups.find((group) => group.key === definition.key),
                    trained,
                  ),
                ])}
                align={['left', 'right', 'right', 'right', 'right', 'right', 'right', 'right']}
                minWidthClass="min-w-[720px]"
                rowClassNames={GROUP_ORDER.map((definition) => definition.rowClass)}
                caption={copy.report.performanceTitle}
              />
            </div>
            {inconclusive && (
              <p className="pt-3 text-xs text-muted">{copy.report.inconclusiveNote}</p>
            )}
          </section>

          <div className="flex flex-wrap items-start gap-6">
            <section
              aria-labelledby="report-calibration-title"
              className="min-w-0 rounded-2xl border border-border/90 bg-surface p-8 shadow-card"
              style={{ flex: '1 1 420px' }}
            >
              <h2 id="report-calibration-title" className="text-base font-bold text-ink">
                {copy.report.calibrationTitle}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-muted">{copy.report.calibrationHelper}</p>
              <div className="pt-2">
                <CalibrationChart series={trained ? report.calibration : []} />
              </div>
            </section>

            <section
              aria-labelledby="report-fairness-title"
              className="min-w-0 rounded-2xl border border-border/90 bg-surface p-8 shadow-card"
              style={{ flex: '1 1 420px' }}
            >
              <h2 id="report-fairness-title" className="text-base font-bold text-ink">
                {copy.report.fairnessTitle}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-muted">{copy.report.fairnessHelper}</p>
              <div className="pt-2">
                <FairnessTable fairness={trained ? report.fairness : []} trained={trained} />
              </div>
            </section>
          </div>

          <section
            aria-labelledby="report-evaluated-title"
            className="rounded-2xl border border-border/90 bg-surface p-8 shadow-card"
          >
            <h2
              id="report-evaluated-title"
              className="font-display text-xl font-bold leading-7 text-ink"
            >
              {copy.report.evaluatedTitle}
            </h2>
            <ul className="mt-4 list-disc space-y-2.5 pl-5 text-sm leading-relaxed text-body marker:text-primary">
              {copy.report.evaluated.map((item) => (
                <li key={item.lead}>
                  <strong className="font-semibold text-ink">{item.lead}</strong>{' '}
                  {fill(item.text, { thin_file_definition: thinDefinition })}
                </li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="report-limits-title"
            className="rounded-2xl border border-warn-border bg-warn-bg/75 p-8"
          >
            <h2
              id="report-limits-title"
              className="font-display text-xl font-bold leading-7 text-ink"
            >
              {copy.report.limitsTitle}
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-body marker:text-amber">
              {copy.report.limits.map((limit) => (
                <li key={limit}>{limit}</li>
              ))}
            </ul>
          </section>
        </>
      )}
    </>
  );
}
