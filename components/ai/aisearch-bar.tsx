import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Search, Filter, X } from "lucide-react"
import { useState } from "react"

interface AISearchBarProps {
  placeholder?: string
  onSearch?: (query: string) => void
  showFilters?: boolean
  filters?: Array<{
    label: string
    value: string
    options: Array<{ label: string; value: string }>
  }>
  onFilterChange?: (filters: Record<string, string>) => void
  className?: string
}

export function AISearchBar({
  placeholder = "Search...",
  onSearch,
  showFilters = false,
  filters,
  onFilterChange,
  className
}: AISearchBarProps) {
  const [query, setQuery] = useState("")
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})
  const [showFilterMenu, setShowFilterMenu] = useState(false)

  const handleSearch = () => {
    onSearch?.(query)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const handleFilterChange = (filterKey: string, value: string) => {
    const newFilters = { ...activeFilters, [filterKey]: value }
    setActiveFilters(newFilters)
    onFilterChange?.(newFilters)
  }

  const removeFilter = (filterKey: string) => {
    const newFilters = { ...activeFilters }
    delete newFilters[filterKey]
    setActiveFilters(newFilters)
    onFilterChange?.(newFilters)
  }

  const clearAllFilters = () => {
    setActiveFilters({})
    onFilterChange?.({})
  }

  const hasActiveFilters = Object.keys(activeFilters).length > 0

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-9"
          />
        </div>
        {showFilters && (
          <Button
            variant="outline"
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="relative"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 h-2 w-2 rounded-full bg-primary" />
            )}
          </Button>
        )}
        <Button onClick={handleSearch}>
          Search
        </Button>
      </div>

      {showFilters && showFilterMenu && filters && (
        <div className="p-4 border rounded-lg bg-card">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Filters</h4>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
              >
                Clear all
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filters.map((filter) => (
              <div key={filter.value}>
                <label className="text-sm font-medium mb-1.5 block">
                  {filter.label}
                </label>
                <select
                  className="w-full p-2 border rounded-md text-sm"
                  value={activeFilters[filter.value] || ""}
                  onChange={(e) => handleFilterChange(filter.value, e.target.value)}
                >
                  <option value="">All</option>
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(activeFilters).map(([key, value]) => {
            const filter = filters?.find(f => f.value === key)
            const option = filter?.options.find(o => o.value === value)
            return (
              <div
                key={key}
                className="flex items-center gap-1 px-3 py-1.5 bg-secondary rounded-full text-sm"
              >
                <span className="font-medium">{filter?.label}:</span>
                <span>{option?.label || value}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => removeFilter(key)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}