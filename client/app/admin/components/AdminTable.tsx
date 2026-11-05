// app/admin/components/AdminTable.tsx
'use client';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
}

interface AdminTableProps<T> {
  columns: Column<T>[];
  data: T[];
}

export default function AdminTable<T extends { id: string | number }>({ columns, data }: AdminTableProps<T>) {
  return (
    <table border={1} cellPadding={8} cellSpacing={0} style={{ width: '100%', marginTop: '1rem' }}>
      <thead>
        <tr>
          {columns.map((col, idx) => (
            <th key={idx} style={{ textAlign: 'left' }}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td colSpan={columns.length} style={{ textAlign: 'center' }}>No records found</td>
          </tr>
        ) : (
          data.map((row) => (
            <tr key={row.id}>
              {columns.map((col, idx) => (
                <td key={idx}>
                  {typeof col.accessor === 'function' ? col.accessor(row) : (row[col.accessor] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}