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

/** The one derivation behind KPIs, pills and the CSV export (spec 6.4). */
export function rankedRows(batch: Batch, approve: number, reject: number): RankedRow[] {
  return [...batch.rows]
    .sort((a, b) => a.risk - b.risk || a.id.localeCompare(b.id))
    .map((row, index) => ({
      rank: index + 1,
      id: row.id,
      risk: row.risk,
      riskPercent: (row.risk * 100).toFixed(1),
      band: bandFor(row.risk * 100, approve, reject),
      thin: row.is_thin_file,
      fileType: row.is_thin_file ? copy.report.thinFile : copy.report.thickFile,
      mainReason: row.top_reason ?? copy.batch.dash,
    }));
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
