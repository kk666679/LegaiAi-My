"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { MoreVertical, RefreshCw, Settings, Maximize2, Minimize2, X } from "lucide-react"
import { useState } from "react"

interface AIWidgetProps {
  title: string
  description?: string
  children: React.ReactNode
  actions?: Array<{
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }>
  onRefresh?: () => void
  onSettings?: () => void
  onRemove?: () => void
  className?: string
  loading?: boolean
  collapsible?: boolean
  defaultCollapsed?: boolean
  resizable?: boolean
  headerContent?: React.ReactNode
}

export function AIWidget({
  title,
  description,
  children,
  actions,
  onRefresh,
  onSettings,
  onRemove,
  className,
  loading = false,
  collapsible = false,
  defaultCollapsed = false,
  resizable = false,
  headerContent
}: AIWidgetProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const [isMaximized, setIsMaximized] = useState(false)

  const toggleCollapse = () => {
    if (collapsible) {
      setIsCollapsed(!isCollapsed)
    }
  }

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized)
  }

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300",
        isMaximized && "fixed inset-4 z-50",
        className
      )}
    >
      <CardHeader className="space-y-0 p-4">
        <div className="flex items-center justify-between">
          <div 
            className={cn(
              "flex-1 cursor-pointer",
              collapsible && "cursor-pointer"
            )}
            onClick={toggleCollapse}
          >
            <div className="flex items-center gap-3">
              <CardTitle className="text-base font-semibold">
                {title}
              </CardTitle>
              {description && !isCollapsed && (
                <CardDescription className="hidden sm:inline">
                  {description}
                </CardDescription>
              )}
            </div>
            {headerContent}
          </div>
          
          <div className="flex items-center gap-1">
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={onRefresh}
                disabled={loading}
              >
                <RefreshCw className={cn(
                  "h-4 w-4",
                  loading && "animate-spin"
                )} />
              </Button>
            )}
            
            {resizable && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={toggleMaximize}
              >
                {isMaximized ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            )}
            
            {onSettings && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={onSettings}
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
            
            {onRemove && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                onClick={onRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            
            {actions && actions.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className={cn(
        "p-4 pt-0 transition-all duration-300",
        isCollapsed && "hidden"
      )}>
        <div className={cn(
          "relative",
          loading && "opacity-50 pointer-events-none"
        )}>
          {children}
          
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <div className="text-center">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            </div>
          )}
        </div>
        
        {actions && actions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={action.onClick}
                className="gap-2"
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}