interface Column<T> {
  key: keyof T | string
  label: string
  render?: (row: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  emptyMsg?: string
}

export default function DataTable<T extends object>({ columns, data, emptyMsg = 'Aucune donnée' }: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-8 text-center text-gray-400 text-sm">
        {emptyMsg}
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs md:text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {columns.map(col => (
                <th key={String(col.key)} className="px-3 md:px-4 py-2.5 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                {columns.map(col => (
                  <td key={String(col.key)} className="px-3 md:px-4 py-2.5 md:py-3 text-gray-700 whitespace-nowrap">
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[String(col.key)] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
