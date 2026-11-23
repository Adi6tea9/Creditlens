import type { Batch } from '../api/schemas';
import { copy } from '../content/copy';
import { bandFor, type Band } from './bands';
import { toCsv } from './csv';

export interface RankedRow {
  rank: number;
  id: string;
  risk: number;
  riskPercent: string;
  band: Band;
  thin: boolean;
  fileType: string;
  mainReason: string;
}

type BaseRow = Omit<RankedRow, 'band'>;

export interface PreparedRanking {
  rows: BaseRow[];
  risksPercent: number[];
}

/** Sort once per file; slider updates only touch counts and the visible page. */
export function prepareRanking(batch: Batch): PreparedRanking {
  const rows = [...batch.rows]
    .sort((a, b) => a.risk - b.risk || a.id.localeCompare(b.id))
    .map((row, index) => ({
      rank: index + 1,
      id: row.id,
      risk: row.risk,
      riskPercent: (row.risk * 100).toFixed(1),
      thin: row.is_thin_file,
      fileType: row.is_thin_file ? copy.report.thinFile : copy.report.thickFile,
      mainReason: row.top_reason ?? copy.batch.dash,
    }));
  return { rows, risksPercent: rows.map((row) => row.risk * 100) };
}

function lowerBound(values: number[], target: number): number {
  let low = 0;
  let high = values.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (values[mid] < target) low = mid + 1;
    else high = mid;
  }
  return low;
}

function upperBound(values: number[], target: number): number {
  let low = 0;
  let high = values.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (values[mid] <= target) low = mid + 1;
    else high = mid;
  }
  return low;
}

/** Matches bandFor at the cutoffs: equal to either bound stays in Review. */
export function rankedCounts(
  prepared: PreparedRanking,
  approve: number,
  reject: number,
): Record<Band, number> {
  const approveCount = lowerBound(prepared.risksPercent, approve);
  const rejectCount = prepared.risksPercent.length - upperBound(prepared.risksPercent, reject);
  return {
    Approve: approveCount,
    Review: prepared.risksPercent.length - approveCount - rejectCount,
    Reject: rejectCount,
  };
}

export function rankedPage(
  prepared: PreparedRanking,
  approve: number,
  reject: number,
  offset: number,
  size: number,
): RankedRow[] {
  return prepared.rows.slice(offset, offset + size).map((row) => ({
    ...row,
    band: bandFor(row.risk * 100, approve, reject),
  }));
}

function withBands(prepared: PreparedRanking, approve: number, reject: number): RankedRow[] {
  return prepared.rows.map((row) => ({
    ...row,
    band: bandFor(row.risk * 100, approve, reject),
  }));
}

/** Full derivation retained for the CSV export and existing unit tests. */
export function rankedRows(batch: Batch, approve: number, reject: number): RankedRow[] {
  return withBands(prepareRanking(batch), approve, reject);
}

export function rankedCsv(rows: RankedRow[]): string {
  return toCsv([
    copy.batch.csvHeader.split(','),
    ...rows.map((row) => [
      row.rank,
      row.id,
      row.riskPercent,
      row.band,
      row.fileType,
      row.mainReason,
    ]),
  ]);
}

export function rankedCsvFor(
  prepared: PreparedRanking,
  approve: number,
  reject: number,
): string {
  return rankedCsv(withBands(prepared, approve, reject));
}
