import type { ReactNode } from 'react';

interface DataTableProps {
  columns: string[];
  rows: ReactNode[][];
  /** Per-column alignment; numbers should be right-aligned (spec 5). */
  align?: Array<'left' | 'right'>;
  caption?: string;
}

/**
 * Spec 5 — scrollable table. Never display:flex on a td/th; wrap cell content
 * in an inner inline-flex span instead. First-column cell is th scope="row".
 */
export default function DataTable({ columns, rows, align, caption }: DataTableProps) {
  const cellAlign = (i: number) => (align?.[i] === 'right' ? 'text-right' : 'text-left');
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/90">
      <table className="min-w-full divide-y divide-slate-200">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="bg-thead/90">
          <tr>
            {columns.map((col, i) => (
              <th
                key={i}
                scope="col"
                className={`px-4 py-3 text-xs font-semibold text-slate-500 ${cellAlign(i)}`}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((row, r) => (
            <tr key={r} className="hover:bg-slate-50/70">
              {row.map((cell, c) =>
                c === 0 ? (
                  <th
                    key={c}
                    scope="row"
                    className={`px-4 py-3.5 text-xs font-medium sm:text-sm ${cellAlign(c)}`}
                  >
                    {cell}
                  </th>
                ) : (
                  <td key={c} className={`px-4 py-3.5 text-xs sm:text-sm ${cellAlign(c)}`}>
                    {cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
