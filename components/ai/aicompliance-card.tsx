import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { CheckCircle2, XCircle, AlertTriangle, Clock } from "lucide-react"

interface ComplianceRequirement {
  id: string
  name: string
  status: "compliant" | "non-compliant" | "warning" | "pending"
  lastChecked: string
  description?: string
}

interface AIComplianceCardProps {
  title: string
  description: string
  complianceRate: number
  requirements: ComplianceRequirement[]
  lastAudit?: string
  className?: string
}

export function AIComplianceCard({
  title,
  description,
  complianceRate,
  requirements,
  lastAudit,
  className
}: AIComplianceCardProps) {
  const getStatusIcon = (status: ComplianceRequirement["status"]) => {
    switch (status) {
      case "compliant":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "non-compliant":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "pending":
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: ComplianceRequirement["status"]) => {
    switch (status) {
      case "compliant":
        return "text-green-700 bg-green-50 border-green-200"
      case "non-compliant":
        return "text-red-700 bg-red-50 border-red-200"
      case "warning":
        return "text-yellow-700 bg-yellow-50 border-yellow-200"
      case "pending":
        return "text-gray-700 bg-gray-50 border-gray-200"
    }
  }

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{complianceRate}%</span>
            <span className="text-sm text-muted-foreground">Compliant</span>
          </div>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Compliance Progress</span>
            <span>{complianceRate}%</span>
          </div>
          <Progress value={complianceRate} className="h-2" />
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-sm">Requirements Status</h4>
          {requirements.map((req) => (
            <div
              key={req.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                getStatusColor(req.status)
              )}
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(req.status)}
                <div>
                  <p className="font-medium text-sm">{req.name}</p>
                  {req.description && (
                    <p className="text-xs opacity-75">{req.description}</p>
                  )}
                </div>
              </div>
              <div className="text-xs text-right">
                <p className="font-medium capitalize">{req.status}</p>
                <p className="opacity-75">Checked: {req.lastChecked}</p>
              </div>
            </div>
          ))}
        </div>

        {lastAudit && (
          <div className="text-xs text-muted-foreground">
            Last audit: {lastAudit}
          </div>
        )}
      </CardContent>
    </Card>
  )
}