import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { 
  Zap, 
  Brain, 
  Sparkles, 
  BarChart3, 
  Shield, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Play,
  Pause,
  Settings,
  MoreVertical
} from "lucide-react"
import { useState } from "react"

export type FeatureStatus = "active" | "inactive" | "pending" | "error" | "training"
export type FeaturePriority = "critical" | "high" | "medium" | "low"

interface AIFeature {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  status: FeatureStatus
  priority?: FeaturePriority
  progress?: number
  lastUpdated?: string
  metrics?: {
    label: string
    value: string | number
    trend?: number
  }[]
  tags?: string[]
}

interface AIFeaturesCardProps {
  title: string
  description?: string
  features: AIFeature[]
  onFeatureClick?: (feature: AIFeature) => void
  onFeatureToggle?: (featureId: string, active: boolean) => void
  onFeatureSettings?: (featureId: string) => void
  className?: string
  compact?: boolean
  maxFeatures?: number
  showControls?: boolean
  showMetrics?: boolean
}

export function AIFeaturesCard({
  title,
  description,
  features,
  onFeatureClick,
  onFeatureToggle,
  onFeatureSettings,
  className,
  compact = false,
  maxFeatures = 4,
  showControls = true,
  showMetrics = true
}: AIFeaturesCardProps) {
  const [expanded, setExpanded] = useState(false)
  
  const displayedFeatures = expanded ? features : features.slice(0, maxFeatures)
  const hasMoreFeatures = features.length > maxFeatures
  
  const getStatusConfig = (status: FeatureStatus) => {
    const config = {
      active: {
        label: "Active",
        icon: <CheckCircle2 className="h-3 w-3" />,
        color: "text-green-600",
        bg: "bg-green-100",
        border: "border-green-200"
      },
      inactive: {
        label: "Inactive",
        icon: <Pause className="h-3 w-3" />,
        color: "text-gray-600",
        bg: "bg-gray-100",
        border: "border-gray-200"
      },
      pending: {
        label: "Pending",
        icon: <Clock className="h-3 w-3" />,
        color: "text-yellow-600",
        bg: "bg-yellow-100",
        border: "border-yellow-200"
      },
      error: {
        label: "Error",
        icon: <AlertCircle className="h-3 w-3" />,
        color: "text-red-600",
        bg: "bg-red-100",
        border: "border-red-200"
      },
      training: {
        label: "Training",
        icon: <Brain className="h-3 w-3" />,
        color: "text-blue-600",
        bg: "bg-blue-100",
        border: "border-blue-200"
      }
    }
    return config[status]
  }
  
  const getPriorityConfig = (priority?: FeaturePriority) => {
    if (!priority) return null
    
    const config = {
      critical: {
        label: "Critical",
        color: "bg-red-100 text-red-800 border-red-200"
      },
      high: {
        label: "High",
        color: "bg-orange-100 text-orange-800 border-orange-200"
      },
      medium: {
        label: "Medium",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200"
      },
      low: {
        label: "Low",
        color: "bg-green-100 text-green-800 border-green-200"
      }
    }
    return config[priority]
  }

  const getIconForTitle = (title: string) => {
    const titleLower = title.toLowerCase()
    if (titleLower.includes("prediction") || titleLower.includes("analy")) {
      return <Brain className="h-5 w-5" />
    }
    if (titleLower.includes("auto") || titleLower.includes("optimize")) {
      return <Zap className="h-5 w-5" />
    }
    if (titleLower.includes("insight") || titleLower.includes("recommend")) {
      return <Sparkles className="h-5 w-5" />
    }
    if (titleLower.includes("analytics") || titleLower.includes("report")) {
      return <BarChart3 className="h-5 w-5" />
    }
    if (titleLower.includes("security") || titleLower.includes("compliance")) {
      return <Shield className="h-5 w-5" />
    }
    return <Sparkles className="h-5 w-5" />
  }

  const handleFeatureToggle = (feature: AIFeature, e: React.MouseEvent) => {
    e.stopPropagation()
    onFeatureToggle?.(feature.id, feature.status !== "active")
  }

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
          {description && (
            <CardDescription>{description}</CardDescription>
          )}
        </div>
        
        <Badge variant="outline" className="gap-2">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          {features.filter(f => f.status === "active").length}/{features.length} Active
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {displayedFeatures.map((feature) => {
            const statusConfig = getStatusConfig(feature.status)
            const priorityConfig = getPriorityConfig(feature.priority)
            
            return (
              <div
                key={feature.id}
                className={cn(
                  "group relative p-4 rounded-lg border transition-all duration-200",
                  "hover:shadow-md hover:border-primary/50 cursor-pointer",
                  onFeatureClick && "hover:bg-muted/50"
                )}
                onClick={() => onFeatureClick?.(feature)}
              >
                <div className="flex items-start gap-3">
                  {/* Feature Icon */}
                  <div className={cn(
                    "p-2 rounded-lg",
                    statusConfig.bg,
                    statusConfig.color
                  )}>
                    {feature.icon || getIconForTitle(feature.title)}
                  </div>
                  
                  {/* Feature Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm leading-none">
                            {feature.title}
                          </h4>
                          {priorityConfig && (
                            <Badge 
                              variant="outline" 
                              className={cn("text-xs", priorityConfig.color)}
                            >
                              {priorityConfig.label}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {feature.description}
                        </p>
                      </div>
                      
                      {/* Status Badge */}
                      <div className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border",
                        statusConfig.bg,
                        statusConfig.border,
                        statusConfig.color
                      )}>
                        {statusConfig.icon}
                        <span>{statusConfig.label}</span>
                      </div>
                    </div>
                    
                    {/* Metrics and Progress */}
                    {showMetrics && (
                      <div className="mt-3 space-y-2">
                        {feature.progress !== undefined && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium">{feature.progress}%</span>
                            </div>
                            <Progress value={feature.progress} className="h-1.5" />
                          </div>
                        )}
                        
                        {feature.metrics && feature.metrics.length > 0 && (
                          <div className="flex flex-wrap gap-4 pt-1">
                            {feature.metrics.map((metric, index) => (
                              <div key={index} className="text-xs">
                                <div className="text-muted-foreground">{metric.label}</div>
                                <div className="font-medium flex items-center gap-1">
                                  {metric.value}
                                  {metric.trend !== undefined && (
                                    <span className={cn(
                                      "text-xs",
                                      metric.trend > 0 ? "text-green-600" : 
                                      metric.trend < 0 ? "text-red-600" : "text-gray-600"
                                    )}>
                                      {metric.trend > 0 ? "↑" : metric.trend < 0 ? "↓" : "→"}
                                      {Math.abs(metric.trend)}%
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {feature.tags && feature.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-2">
                            {feature.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {feature.lastUpdated && (
                      <div className="text-xs text-muted-foreground mt-2">
                        Updated {feature.lastUpdated}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Controls */}
                {showControls && (
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={(e) => handleFeatureToggle(feature, e)}
                        title={feature.status === "active" ? "Deactivate" : "Activate"}
                      >
                        {feature.status === "active" ? (
                          <Pause className="h-3 w-3" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                      </Button>
                      
                      {onFeatureSettings && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            onFeatureSettings(feature.id)
                          }}
                          title="Settings"
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                      )}
                      
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-7 w-7 p-0"
                        title="More options"
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        
        {/* Expand/Collapse */}
        {hasMoreFeatures && (
          <Button
            variant="secondary"
            size="sm"
            className="w-full gap-2"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Show Less" : `Show ${features.length - maxFeatures} More Features`}
            <ArrowRight className={cn(
              "h-3 w-3 transition-transform",
              expanded && "rotate-90"
            )} />
          </Button>
        )}
        
        {/* Summary Stats */}
        {!compact && (
          <div className="pt-4 border-t">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <div className="text-2xl font-bold">
                  {features.filter(f => f.status === "active").length}
                </div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
              
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <div className="text-2xl font-bold">
                  {features.filter(f => f.status === "training").length}
                </div>
                <div className="text-sm text-muted-foreground">Training</div>
              </div>
              
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <div className="text-2xl font-bold">
                  {features.filter(f => f.priority === "high" || f.priority === "critical").length}
                </div>
                <div className="text-sm text-muted-foreground">High Priority</div>
              </div>
              
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <div className="text-2xl font-bold">
                  {Math.round(
                    features.reduce((acc, f) => acc + (f.progress || 0), 0) / features.length
                  )}%
                </div>
                <div className="text-sm text-muted-foreground">Avg. Progress</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Pre-configured feature sets for common use cases
export const defaultAIFeatures: AIFeature[] = [
  {
    id: "1",
    title: "Predictive Analytics",
    description: "Forecast trends and predict future outcomes based on historical data",
    icon: <Brain className="h-5 w-5" />,
    status: "active",
    priority: "high",
    progress: 85,
    lastUpdated: "2 hours ago",
    metrics: [
      { label: "Accuracy", value: "94.2%", trend: 2.1 },
      { label: "Predictions", value: "1.2k", trend: 12.5 }
    ],
    tags: ["ML", "Forecasting", "Real-time"]
  },
  {
    id: "2",
    title: "Automated Insights",
    description: "Automatically generate actionable insights from complex datasets",
    icon: <Sparkles className="h-5 w-5" />,
    status: "training",
    priority: "medium",
    progress: 45,
    lastUpdated: "1 day ago",
    metrics: [
      { label: "Insights", value: "245", trend: 8.3 },
      { label: "Processing Time", value: "2.4s", trend: -15.2 }
    ],
    tags: ["NLP", "Analysis", "Automation"]
  },
  {
    id: "3",
    title: "Anomaly Detection",
    description: "Identify unusual patterns and potential threats in real-time",
    icon: <Shield className="h-5 w-5" />,
    status: "active",
    priority: "critical",
    progress: 100,
    lastUpdated: "5 minutes ago",
    metrics: [
      { label: "Detected", value: "18", trend: 25 },
      { label: "False Positives", value: "0.3%", trend: -5.1 }
    ],
    tags: ["Security", "Monitoring", "Real-time"]
  },
  {
    id: "4",
    title: "Natural Language Processing",
    description: "Understand and process human language for intelligent interactions",
    icon: <Zap className="h-5 w-5" />,
    status: "inactive",
    priority: "medium",
    progress: 0,
    lastUpdated: "1 week ago",
    metrics: [
      { label: "Queries", value: "0", trend: 0 },
      { label: "Accuracy", value: "91.7%", trend: 1.2 }
    ],
    tags: ["NLP", "Chat", "Text Analysis"]
  },
  {
    id: "5",
    title: "Image Recognition",
    description: "Advanced computer vision for object detection and classification",
    icon: <BarChart3 className="h-5 w-5" />,
    status: "error",
    priority: "high",
    progress: 30,
    lastUpdated: "3 hours ago",
    metrics: [
      { label: "Accuracy", value: "87.5%", trend: -3.2 },
      { label: "Processing", value: "Error" }
    ],
    tags: ["CV", "Deep Learning", "Classification"]
  },
  {
    id: "6",
    title: "Recommendation Engine",
    description: "Personalized content and product recommendations",
    icon: <Sparkles className="h-5 w-5" />,
    status: "active",
    priority: "low",
    progress: 100,
    lastUpdated: "Just now",
    metrics: [
      { label: "CTR", value: "12.4%", trend: 4.8 },
      { label: "Engagement", value: "+32%", trend: 8.7 }
    ],
    tags: ["Personalization", "ML", "E-commerce"]
  }
]