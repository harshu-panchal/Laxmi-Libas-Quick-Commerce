import React from 'react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
}

export function Table<T>({ columns, data, onRowClick }: TableProps<T>) {
  return (
    <div className="w-full overflow-x-auto bg-white rounded-2xl border border-neutral-100 shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-neutral-50 border-b border-neutral-100">
            {columns.map((column, idx) => (
              <th
                key={idx}
                className={`p-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider ${column.className}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-50">
          {data.length > 0 ? (
            data.map((item, rowIdx) => (
              <tr
                key={rowIdx}
                onClick={() => onRowClick?.(item)}
                className={`hover:bg-neutral-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map((column, colIdx) => (
                  <td key={colIdx} className={`p-4 text-sm text-neutral-700 ${column.className}`}>
                    {typeof column.accessor === 'function'
                      ? column.accessor(item)
                      : (item[column.accessor] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="p-8 text-center text-neutral-400 italic">
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
