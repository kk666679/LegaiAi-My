import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { ArrowUpDown, Filter, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  render?: (value: any, row: T) => React.ReactNode
}

interface AIDataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  onSort?: (key: string, direction: 'asc' | 'desc') => void
  onRowClick?: (row: T) => void
  className?: string
  striped?: boolean
  hoverable?: boolean
  compact?: boolean
}

export function AIDataTable<T extends Record<string, any>>({
  data,
  columns,
  onSort,
  onRowClick,
  className,
  striped = true,
  hoverable = true,
  compact = false
}: AIDataTableProps<T>) {
  return (
    <div className={cn("rounded-md border", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key}>
                <div className="flex items-center gap-1">
                  {column.label}
                  {column.sortable && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={() => onSort?.(column.key, 'asc')}
                    >
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </TableHead>
            ))}
            <TableHead className="w-[50px]">
              <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow
              key={rowIndex}
              className={cn(
                striped && rowIndex % 2 === 0 && "bg-muted/50",
                hoverable && "hover:bg-muted/80 cursor-pointer",
                onRowClick && "cursor-pointer"
              )}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => (
                <TableCell key={column.key} className={compact ? "py-2" : "py-4"}>
                  {column.render
                    ? column.render(row[column.key], row)
                    : String(row[column.key])}
                </TableCell>
              ))}
              <TableCell className={compact ? "py-2" : "py-4"}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}