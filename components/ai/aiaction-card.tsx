import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Zap, ChevronRight, ExternalLink, Download, Play } from "lucide-react"

interface AIActionCardProps {
  title: string
  description: string
  actions: Array<{
    label: string
    onClick: () => void
    icon?: React.ReactNode
    variant?: "default" | "outline" | "secondary" | "ghost" | "destructive"
    disabled?: boolean
  }>
  icon?: React.ReactNode
  status?: "pending" | "completed" | "in-progress"
  priority?: "high" | "medium" | "low"
  className?: string
}

export function AIActionCard({
  title,
  description,
  actions,
  icon = <Zap className="h-5 w-5" />,
  status,
  priority,
  className
}: AIActionCardProps) {
  const getStatusBadge = () => {
    if (!status) return null
    
    const statusConfig = {
      pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800" },
      "in-progress": { label: "In Progress", className: "bg-blue-100 text-blue-800" },
      completed: { label: "Completed", className: "bg-green-100 text-green-800" },
    }

    const config = statusConfig[status]
    return (
      <span className={cn(
        "px-2 py-1 text-xs rounded-full font-medium",
        config.className
      )}>
        {config.label}
      </span>
    )
  }

  const getPriorityBadge = () => {
    if (!priority) return null
    
    const priorityConfig = {
      high: { label: "High", className: "bg-red-100 text-red-800" },
      medium: { label: "Medium", className: "bg-orange-100 text-orange-800" },
      low: { label: "Low", className: "bg-gray-100 text-gray-800" },
    }

    const config = priorityConfig[priority]
    return (
      <span className={cn(
        "px-2 py-1 text-xs rounded-full font-medium",
        config.className
      )}>
        {config.label}
      </span>
    )
  }

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary/10">
              {icon}
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            {getStatusBadge()}
            {getPriorityBadge()}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3">
          {actions && actions.length > 0 ? (
            actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || "default"}
                onClick={action.onClick}
                disabled={action.disabled}
                className="gap-2"
              >
                {action.icon}
                {action.label}
              </Button>
            ))
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
