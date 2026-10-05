import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { 
  ChevronDown, 
  ChevronUp, 
  MoreHorizontal, 
  Search, 
  Filter,
  Download,
  RefreshCw 
} from "lucide-react"
import { useState } from "react"

interface Column<T> {
  key: keyof T | string
  header: string
  cell?: (value: any, row: T) => React.ReactNode
  sortable?: boolean
  width?: string
}

interface AITableProps<T> {
  data: T[]
  columns: Column<T>[]
  onRowClick?: (row: T) => void
  onSort?: (column: keyof T, direction: 'asc' | 'desc') => void
  onSelectionChange?: (selectedRows: T[]) => void
  searchable?: boolean
  selectable?: boolean
  pagination?: {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
  }
  loading?: boolean
  className?: string
}

export function AITable<T extends { id: string | number }>({
  data,
  columns,
  onRowClick,
  onSort,
  onSelectionChange,
  searchable = false,
  selectable = false,
  pagination,
  loading = false,
  className
}: AITableProps<T>) {
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set())
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchQuery, setSearchQuery] = useState('')

  const handleSort = (column: keyof T) => {
    let direction: 'asc' | 'desc' = 'asc'
    
    if (sortColumn === column) {
      direction = sortDirection === 'asc' ? 'desc' : 'asc'
    }
    
    setSortColumn(column)
    setSortDirection(direction)
    onSort?.(column, direction)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(data.map(row => row.id))
      setSelectedRows(allIds)
      onSelectionChange?.(data)
    } else {
      setSelectedRows(new Set())
      onSelectionChange?.([])
    }
  }

  const handleSelectRow = (row: T, checked: boolean) => {
    const newSelected = new Set(selectedRows)
    
    if (checked) {
      newSelected.add(row.id)
    } else {
      newSelected.delete(row.id)
    }
    
    setSelectedRows(newSelected)
    const selectedData = data.filter(row => newSelected.has(row.id))
    onSelectionChange?.(selectedData)
  }

  const filteredData = searchQuery
    ? data.filter(row =>
        columns.some(column => {
          const value = row[column.key as keyof T]
          return String(value).toLowerCase().includes(searchQuery.toLowerCase())
        })
      )
    : data

  const isAllSelected = data.length > 0 && selectedRows.size === data.length
  const isSomeSelected = selectedRows.size > 0 && selectedRows.size < data.length

  return (
    <div className={cn("space-y-4", className)}>
      {/* Table Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {searchable && (
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full sm:w-[300px]"
            />
          </div>
        )}
        
        <div className="flex items-center gap-2 ml-auto">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              )}
              
              {columns.map((column) => (
                <TableHead 
                  key={String(column.key)} 
                  style={{ width: column.width }}
                >
                  <div className="flex items-center">
                    {column.header}
                    {column.sortable && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 ml-1"
                        onClick={() => handleSort(column.key as keyof T)}
                      >
                        {sortColumn === column.key ? (
                          sortDirection === 'asc' ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )
                        ) : (
                          <ChevronDown className="h-3 w-3 opacity-50" />
                        )}
                      </Button>
                    )}
                  </div>
                </TableHead>
              ))}
              
              <TableHead className="w-[50px]">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell 
                  colSpan={columns.length + (selectable ? 2 : 1)}
                  className="h-24 text-center"
                >
                  <div className="flex items-center justify-center">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                    Loading data...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={columns.length + (selectable ? 2 : 1)}
                  className="h-24 text-center text-muted-foreground"
                >
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(
                    onRowClick && "cursor-pointer hover:bg-muted/50",
                    selectedRows.has(row.id) && "bg-muted/30"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.has(row.id)}
                        onCheckedChange={(checked: boolean) => 
                          handleSelectRow(row, checked as boolean)
                        }
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      />
                    </TableCell>
                  )}
                  
                  {columns.map((column, colIndex) => (
                    <TableCell key={column.key ? String(column.key) : `col-${colIndex}`}>
                      {column.cell
                        ? column.cell(row[column.key as keyof T], row)
                        : String(row[column.key as keyof T] ?? '')}
                    </TableCell>
                  ))}
                  
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>View details</DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
            {pagination.total} entries
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            
            {Array.from(
              { length: Math.ceil(pagination.total / pagination.pageSize) },
              (_, i) => i + 1
            )
              .slice(
                Math.max(0, pagination.page - 3),
                Math.min(
                  Math.ceil(pagination.total / pagination.pageSize),
                  pagination.page + 2
                )
              )
              .map((pageNum) => (
                <Button
                  key={pageNum}
                  variant={pageNum === pagination.page ? "default" : "outline"}
                  size="sm"
                  onClick={() => pagination.onPageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              ))}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={
                pagination.page >= Math.ceil(pagination.total / pagination.pageSize)
              }
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
