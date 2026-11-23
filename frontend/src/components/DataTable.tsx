import type { ReactNode } from 'react';

interface DataTableProps {
  columns: string[];
  rows: ReactNode[][];
  /** Per-column alignment; numbers should be right-aligned (spec 5). */
  align?: Array<'left' | 'right'>;
  caption?: string;
  minWidthClass?: string;
  /** Column that identifies the row (spec 5 defaults to the first column). */
  rowHeaderIndex?: number;
  /** Extra classes per body row, e.g. the shaded "All applicants" row. */
  rowClassNames?: string[];
}

/**
 * Spec 5 — scrollable table. Never display:flex on a td/th; wrap cell content
 * in an inner inline-flex span instead. First-column cell is th scope="row".
 */
export default function DataTable({
  columns,
  rows,
  align,
  caption,
  minWidthClass = 'min-w-full',
  rowHeaderIndex = 0,
  rowClassNames,
}: DataTableProps) {
  const cellAlign = (i: number) => (align?.[i] === 'right' ? 'text-right' : 'text-left');
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/90">
      <table className={`${minWidthClass} divide-y divide-slate-200`}>
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
            <tr key={r} className={`hover:bg-slate-50/70 ${rowClassNames?.[r] ?? ''}`}>
              {row.map((cell, c) =>
                c === rowHeaderIndex ? (
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
