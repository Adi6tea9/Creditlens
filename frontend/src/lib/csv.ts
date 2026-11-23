/** Spec 6.4.2 — spreadsheet-formula guard plus RFC 4180 quoting. */
const DANGEROUS_START = /^[=+\-@\t\r]/;

export function csvCell(value: string | number): string {
  let text = String(value);
  if (DANGEROUS_START.test(text)) text = `'${text}`;
  if (/[",\r\n]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function toCsv(rows: Array<Array<string | number>>): string {
  return rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
}
