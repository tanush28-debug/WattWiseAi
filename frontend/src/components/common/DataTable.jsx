import React from 'react';
import { Skeleton } from './Skeleton';

const NUMERIC_VALUE = /^[\s₹$€£]?[-+]?[\d,]+(?:\.\d+)?\s*%?$/;

const isNumericValue = (value) =>
  typeof value === 'number' || (typeof value === 'string' && NUMERIC_VALUE.test(value));

export const DataTable = ({
  columns = [],
  data = [],
  keyField = 'id',
  isLoading = false,
  emptyMessage = 'No records found.',
  className = ''
}) => {
  return (
    <div className={`overflow-x-auto rounded-md border border-slate-200 ${className}`}>
      <table className="w-full min-w-full border-collapse text-left text-sm text-slate-900">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                scope="col"
                className={`whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 ${
                  col.align === 'right' ? 'text-right' : ''
                } ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td colSpan={columns.length} className="px-4 py-3">
                  <Skeleton className="h-5 w-full" />
                </td>
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-xs text-slate-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={row[keyField] ?? rowIdx}
                className="border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50"
              >
                {columns.map((col, colIdx) => {
                  const value = row[col.key];
                  const mono = col.mono ?? isNumericValue(value);
                  return (
                    <td
                      key={colIdx}
                      className={`px-4 py-2.5 align-middle text-xs text-slate-700 ${
                        col.align === 'right' ? 'text-right' : ''
                      } ${mono ? 'font-mono tabular-nums' : ''} ${col.className || ''}`}
                    >
                      {col.render ? col.render(value, row) : value ?? '—'}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
