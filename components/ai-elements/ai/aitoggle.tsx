import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface AIToggleProps {
  label: string
  description?: string
  defaultChecked?: boolean
  onToggle?: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

export function AIToggle({
  label,
  description,
  defaultChecked = false,
  onToggle,
  disabled = false,
  className
}: AIToggleProps) {
  const [checked, setChecked] = useState(defaultChecked)

  const handleToggle = (newChecked: boolean) => {
    setChecked(newChecked)
    onToggle?.(newChecked)
  }

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="space-y-0.5">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={handleToggle}
        disabled={disabled}
      />
    </div>
  )
}