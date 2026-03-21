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
      <div className="bg-brand/90 rounded-2xl p-8 text-center text-white/60 text-sm shadow-md">
        {emptyMsg}
      </div>
    )
  }

  return (
    <div className="bg-brand rounded-2xl overflow-hidden shadow-md">
      <div className="overflow-x-auto">
        <table className="w-full text-xs md:text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-brand-dark/50">
              {columns.map(col => (
                <th key={String(col.key)} className="px-3 md:px-4 py-2.5 md:py-3 text-left text-[10px] md:text-xs font-semibold text-white/60 uppercase tracking-wider whitespace-nowrap">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                {columns.map(col => (
                  <td key={String(col.key)} className="px-3 md:px-4 py-2.5 md:py-3 text-white/90 whitespace-nowrap">
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
