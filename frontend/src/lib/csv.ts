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

/** Spec 6.4.2 — ephemeral Blob only; no applicant data is stored client-side. */
export function downloadCsv(filename: string, csv: string): void {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
