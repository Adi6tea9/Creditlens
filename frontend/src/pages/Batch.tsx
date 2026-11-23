import { useEffect, useMemo, useState, type ChangeEvent } from 'react';

import { ApiError, postBatch, useMock } from '../api/client';
import { postBatch as mockPostBatch } from '../api/mock';
import type { Batch as BatchResult, BatchError } from '../api/schemas';
import { LoadingCard, StateError } from '../components/AsyncState';
import BandPill from '../components/BandPill';
import Banner from '../components/Banner';
import Card from '../components/Card';
import DataTable from '../components/DataTable';
import FileChip from '../components/FileChip';
import Histogram from '../components/Histogram';
import KpiTile from '../components/KpiTile';
import Page from '../components/Page';
import { DEFAULT_APPROVE, DEFAULT_REJECT } from '../config/project';
import { copy, fill } from '../content/copy';
import { useMeta } from '../hooks/useMeta';
import { bandPercentages } from '../lib/bands';
import { downloadCsv, toCsv } from '../lib/csv';
import { formatCount, formatFixed } from '../lib/format';
import { rankedCsv, rankedRows } from '../lib/ranked';
import { exceedsUploadLimits } from '../lib/upload';

const PAGE_SIZE = 50;

/** Section 7 strings carry their own **bold lead-in** markers. */
function BoldNote({ text }: { text: string }) {
  const [, lead, rest] = text.split('**');
  return (
    <>
      <strong>{lead}</strong>
      {rest}
    </>
  );
}

/** Spec 6.4 — upload, cutoffs, ranked results and CSV, all from one band rule. */
export default function Batch() {
  const mockMode = useMock();
  const { meta } = useMeta();
  const [batch, setBatch] = useState<BatchResult>();
  const [batchLoading, setBatchLoading] = useState(mockMode);
  const [file, setFile] = useState<File>();
  const [approve, setApprove] = useState(DEFAULT_APPROVE);
  const [reject, setReject] = useState(DEFAULT_REJECT);
  const [fileName, setFileName] = useState('');
  const [uploadError, setUploadError] = useState<string>();
  const [uploadFailed, setUploadFailed] = useState(false);
  const [rowErrors, setRowErrors] = useState<BatchError['row_errors']>([]);
  const [scoring, setScoring] = useState(false);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!mockMode) return;
    let active = true;
    mockPostBatch().then((data) => {
      if (!active) return;
      setBatch(data);
      setBatchLoading(false);
    });
    return () => {
      active = false;
    };
  }, [mockMode]);

  useEffect(() => setPage(0), [batch]);

  const risksPercent = useMemo(
    () => (batch ? batch.rows.map((row) => row.risk * 100) : []),
    [batch],
  );
  const ranked = useMemo(
    () => (batch ? rankedRows(batch, approve, reject) : []),
    [batch, approve, reject],
  );
  const counts = useMemo(() => {
    const next = { Approve: 0, Review: 0, Reject: 0 };
    for (const row of ranked) next[row.band] += 1;
    return next;
  }, [ranked]);
  const percentages = useMemo(() => bandPercentages(counts), [counts]);
  const pageRows = ranked.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(ranked.length / PAGE_SIZE));

  function changeApprove(value: number) {
    setApprove(value);
    setReject((current) => Math.max(current, value));
  }

  function changeReject(value: number) {
    setReject(Math.max(value, approve));
  }

  async function scoreFile(file: File) {
    setScoring(true);
    setUploadError(undefined);
    setUploadFailed(false);
    setRowErrors([]);
    try {
      setBatch(await postBatch(file));
    } catch (error) {
      setBatch(undefined);
      if (error instanceof ApiError && error.status === 422) {
        setRowErrors(error.rowErrors ?? []);
      } else {
        setUploadError(error instanceof Error ? error.message : String(error));
        setUploadFailed(true);
      }
    } finally {
      setScoring(false);
    }
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const chosen = event.target.files?.[0];
    event.target.value = '';
    if (!chosen) return;

    setFileName(chosen.name);
    setFile(chosen);
    if (await exceedsUploadLimits(chosen)) {
      setUploadError(copy.batch.tooLarge);
      return;
    }
    await scoreFile(chosen);
  }

  function downloadTemplate() {
    if (!meta) return;
    downloadCsv('applicant-template.csv', toCsv([meta.fields.map((field) => field.id)]));
  }

  function downloadRanked() {
    downloadCsv(copy.batch.csvFilename, rankedCsv(ranked));
  }

  const histogramHelper = batch?.is_sample
    ? copy.batch.histogramHelper
    : copy.batch.histogramHelper.replace(
        'an illustrative sample of 1,000',
        copy.batch.thisFile,
      );

  return (
    <>
      {batch?.is_sample && (
        <Banner variant="info">
          <BoldNote text={copy.batch.sampleBanner} />
        </Banner>
      )}
      <Page title={copy.batch.h1} h1={copy.batch.h1} />
      <p className="max-w-[680px] text-sm text-muted sm:text-base">{copy.batch.lead}</p>

      <div className="flex flex-wrap items-stretch gap-6">
        <Card title={copy.batch.uploadHeading} className="flex-[1_1_380px]">
          <div className="space-y-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-4">
            <div className="text-xs font-semibold text-slate-800">{copy.batch.applicantFile}</div>
            <div className="flex items-center gap-2.5">
              <label
                htmlFor="applicant-file"
                className="inline-flex cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm transition-colors hover:bg-slate-50 focus-within:ring-2 focus-within:ring-teal-500/40"
              >
                <span>{copy.batch.chooseFile}</span>
                <input
                  id="applicant-file"
                  type="file"
                  accept=".csv"
                  className="sr-only"
                  onChange={handleFile}
                />
              </label>
              <span
                aria-live="polite"
                aria-atomic="true"
                className="min-w-0 truncate text-xs text-slate-500"
              >
                {fileName}
              </span>
            </div>
            <p className="pt-0.5 text-xs leading-relaxed text-subtle">{copy.batch.uploadHelper}</p>
          </div>

          {meta && (
            <button
              type="button"
              onClick={downloadTemplate}
              className="text-sm font-semibold text-primary-text underline decoration-teal-300 underline-offset-2 hover:text-teal-800"
            >
              {copy.batch.downloadTemplate}
            </button>
          )}

          {uploadError && !uploadFailed && (
            <p role="alert" className="text-xs font-medium text-error">
              {uploadError}
            </p>
          )}

          {uploadFailed && file && (
            <StateError
              message={uploadError}
              onRetry={() => void scoreFile(file)}
              className="rounded-xl border-2 border-error px-4 py-3 text-xs"
            />
          )}

          {rowErrors.length > 0 && (
            <div role="alert" className="space-y-1.5 text-xs text-error">
              <ul className="list-disc space-y-1 pl-5">
                {rowErrors.slice(0, 10).map((error) => (
                  <li key={`${error.row}-${error.message}`}>Row {error.row}: {error.message}</li>
                ))}
              </ul>
              {rowErrors.length > 10 && (
                <p>{copy.batch.andNMore.replace('N', String(rowErrors.length - 10))}</p>
              )}
            </div>
          )}
        </Card>

        <Card title={copy.batch.cutoffsHeading} className="flex-[1.4_1_480px]">
          <div className="flex flex-wrap gap-6 pt-1">
            <div className="min-w-0 flex-[1_1_220px] space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <label htmlFor="approve-cutoff" className="font-semibold text-slate-800">
                  {copy.batch.approveBelow}
                </label>
                <span className="font-bold tabular-nums text-primary-text">
                  {approve.toFixed(1)}%
                </span>
              </div>
              <input
                id="approve-cutoff"
                type="range"
                min={1}
                max={30}
                step={0.5}
                value={approve}
                onChange={(event) => changeApprove(Number(event.target.value))}
                className="range-slider range-slider--approve"
              />
            </div>
            <div className="min-w-0 flex-[1_1_220px] space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <label htmlFor="reject-cutoff" className="font-semibold text-slate-800">
                  {copy.batch.rejectAbove}
                </label>
                <span className="font-bold tabular-nums text-reject-text">
                  {reject.toFixed(1)}%
                </span>
              </div>
              <input
                id="reject-cutoff"
                type="range"
                min={10}
                max={40}
                step={0.5}
                value={reject}
                onChange={(event) => changeReject(Number(event.target.value))}
                className="range-slider range-slider--reject"
              />
            </div>
          </div>
          <p className="pt-2 text-xs text-subtle">{copy.batch.cutoffsHelper}</p>
        </Card>
      </div>

      <section
        aria-labelledby="batch-results-heading"
        aria-busy={scoring || batchLoading}
        className="space-y-8 rounded-2xl border border-border/90 bg-surface p-6 shadow-card sm:p-8"
      >
        <h2 id="batch-results-heading" className="text-base font-bold text-ink">
          {copy.batch.resultsHeading}
        </h2>

        {scoring && (
          <div className="space-y-3">
            <p role="status" className="text-sm font-medium text-muted">
              {copy.batch.scoring}
            </p>
            <LoadingCard rows={5} className="space-y-3" />
          </div>
        )}
        {!scoring && batchLoading && <LoadingCard rows={5} className="space-y-3" />}

        {!batch && !scoring && !batchLoading && (
          <p className="text-sm text-muted">{copy.batch.emptyState}</p>
        )}

        {batch && !scoring && (
          <>
            <div className="flex flex-wrap gap-4">
              <div className="min-w-[180px] flex-1">
                <KpiTile
                  label={batch.is_sample ? copy.batch.applicantsScoredSample : copy.batch.applicantsScored}
                  value={formatCount(batch.n)}
                  sub={fill(copy.batch.thinSub, {
                    n_thin: formatCount(batch.n_thin),
                    pct: formatFixed(batch.n ? (batch.n_thin / batch.n) * 100 : 0, 1),
                  })}
                />
              </div>
              {(['Approve', 'Review', 'Reject'] as const).map((band) => (
                <div className="min-w-[180px] flex-1" key={band}>
                  <KpiTile
                    tone={band === 'Approve' ? 'approve' : band === 'Review' ? 'review' : 'reject'}
                    label={copy.batch[band.toLowerCase() as 'approve' | 'review' | 'reject']}
                    value={formatCount(counts[band])}
                    sub={fill(copy.batch.pctOfFileSub, {
                      pct: formatFixed(percentages[band], 1),
                    })}
                  />
                </div>
              ))}
            </div>

            <div
              role="img"
              aria-label={copy.batch.stackedBarAria}
              className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
            >
              <div
                data-testid="bar-approve"
                className="h-full bg-teal-600 transition-all duration-200"
                style={{ width: `${percentages.Approve}%` }}
              />
              <div
                data-testid="bar-review"
                className="h-full bg-amber-300 transition-all duration-200"
                style={{ width: `${percentages.Review}%` }}
              />
              <div
                data-testid="bar-reject"
                className="h-full bg-rose-600 transition-all duration-200"
                style={{ width: `${percentages.Reject}%` }}
              />
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-base font-semibold text-ink">{copy.batch.riskDistribution}</h3>
                <p className="mt-0.5 text-xs text-subtle">{histogramHelper}</p>
              </div>
              <Histogram risksPercent={risksPercent} approve={approve} reject={reject} />
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-ink">{copy.batch.rankedList}</h3>
                <button
                  type="button"
                  onClick={downloadRanked}
                  className="inline-flex min-h-touch items-center rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-primary-text shadow-sm transition-colors hover:bg-slate-50"
                >
                  {copy.batch.downloadRanked}
                </button>
              </div>

              <DataTable
                columns={[...copy.batch.tableColumns]}
                rows={pageRows.map((row) => [
                  row.rank,
                  row.id,
                  `${row.riskPercent}%`,
                  <BandPill band={row.band} />,
                  <FileChip thin={row.thin} />,
                  row.mainReason,
                ])}
                align={['left', 'left', 'right', 'left', 'left', 'left']}
                minWidthClass="min-w-[760px]"
                rowHeaderIndex={1}
                caption={copy.batch.rankedList}
              />

              <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-muted">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((current) => current - 1)}
                  className="inline-flex min-h-touch items-center rounded-xl border border-slate-300 bg-white px-3.5 py-2 font-semibold text-ink shadow-sm hover:bg-slate-50 disabled:opacity-50"
                >
                  {copy.batch.previous}
                </button>
                <span className="tabular-nums">
                  {fill(copy.batch.showing, {
                    a: formatCount(ranked.length ? page * PAGE_SIZE + 1 : 0),
                    b: formatCount(Math.min((page + 1) * PAGE_SIZE, ranked.length)),
                    n: formatCount(ranked.length),
                  })}
                </span>
                <button
                  type="button"
                  disabled={page >= pageCount - 1}
                  onClick={() => setPage((current) => current + 1)}
                  className="inline-flex min-h-touch items-center rounded-xl border border-slate-300 bg-white px-3.5 py-2 font-semibold text-ink shadow-sm hover:bg-slate-50 disabled:opacity-50"
                >
                  {copy.batch.next}
                </button>
              </div>

              <p className="text-xs leading-relaxed text-subtle">
                {batch.is_sample ? copy.batch.footnoteSample : copy.batch.footnoteReal}
              </p>
            </div>
          </>
        )}
      </section>
    </>
  );
}
