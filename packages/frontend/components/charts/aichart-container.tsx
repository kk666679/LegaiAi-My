import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Download, Filter, RefreshCw, ZoomIn, ZoomOut, Calendar } from "lucide-react"
import { ReactNode } from "react"

interface ChartTimeRange {
  label: string
  value: string
}

interface ChartMetric {
  label: string
  value: string
  color?: string
}

interface AIChartContainerProps {
  title: string
  description?: string
  children: ReactNode
  timeRanges?: ChartTimeRange[]
  metrics?: ChartMetric[]
  onTimeRangeChange?: (range: string) => void
  onMetricToggle?: (metric: string) => void
  onExport?: () => void
  onRefresh?: () => void
  isLoading?: boolean
  className?: string
}

export function AIChartContainer({
  title,
  description,
  children,
  timeRanges = [
    { label: "1D", value: "1d" },
    { label: "1W", value: "1w" },
    { label: "1M", value: "1m" },
    { label: "3M", value: "3m" },
    { label: "1Y", value: "1y" },
  ],
  metrics,
  onTimeRangeChange,
  onMetricToggle,
  onExport,
  onRefresh,
  isLoading = false,
  className
}: AIChartContainerProps) {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            {title}
            {isLoading && (
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            )}
          </CardTitle>
          {description && (
            <CardDescription>{description}</CardDescription>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          )}
          
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          {timeRanges && onTimeRangeChange && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select onValueChange={onTimeRangeChange} defaultValue={timeRanges[2]?.value}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  {timeRanges.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {metrics && onMetricToggle && (
            <div className="flex flex-wrap gap-2">
              {metrics.map((metric) => (
                <button
                  key={metric.value}
                  onClick={() => onMetricToggle(metric.value)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm hover:bg-secondary transition-colors"
                >
                  {metric.color && (
                    <div 
                      className="h-2 w-2 rounded-full" 
                      style={{ backgroundColor: metric.color }}
                    />
                  )}
                  {metric.label}
                </button>
              ))}
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Chart Area */}
        <div className={cn(
          "relative rounded-lg border bg-gradient-to-b from-background to-muted/30",
          isLoading && "opacity-50"
        )}>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading chart...</p>
              </div>
            </div>
          )}
          
          <div className="p-6 min-h-[300px] flex items-center justify-center">
            {children}
          </div>
        </div>
        
        {/* Chart Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {metrics?.slice(0, 4).map((metric) => (
            <div key={metric.value} className="text-center p-3 rounded-lg bg-secondary/50">
              <div className="text-2xl font-bold">--</div>
              <div className="text-sm text-muted-foreground">{metric.label}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}