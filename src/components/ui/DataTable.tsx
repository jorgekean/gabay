import * as React from "react"
import { cn } from "../../lib/utils"

export interface ColumnDef<T> {
  header: string
  accessorKey?: keyof T
  cell?: (item: T) => React.ReactNode
}

interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  keyExtractor: (item: T) => string
  renderMobileCard?: (item: T) => React.ReactNode
  className?: string
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  renderMobileCard,
  className
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border rounded-lg bg-card">
        <p>No results found.</p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Mobile View: Render Cards if renderMobileCard is provided */}
      {renderMobileCard && (
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {data.map((item) => (
            <React.Fragment key={keyExtractor(item)}>
              {renderMobileCard(item)}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Desktop View: Render Table */}
      <div className={cn("rounded-md border bg-card overflow-hidden", renderMobileCard ? "hidden md:block" : "block")}>
        <div className="w-full overflow-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                {columns.map((col, i) => (
                  <th
                    key={i}
                    className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {data.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                >
                  {columns.map((col, i) => (
                    <td key={i} className="p-4 align-middle">
                      {col.cell
                        ? col.cell(item)
                        : col.accessorKey
                        ? String(item[col.accessorKey] ?? "")
                        : null}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
