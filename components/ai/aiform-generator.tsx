import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Wand2 } from "lucide-react"

interface FormField {
  id: string
  label: string
  type: 'text' | 'number' | 'email' | 'password' | 'textarea' | 'select' | 'switch' | 'date'
  required?: boolean
  placeholder?: string
  options?: Array<{ label: string; value: string }>
  description?: string
}

interface AIFormGeneratorProps {
  fields: FormField[]
  onSubmit: (data: Record<string, any>) => void
  submitLabel?: string
  className?: string
}

export function AIFormGenerator({
  fields,
  onSubmit,
  submitLabel = "Submit",
  className
}: AIFormGeneratorProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data: Record<string, any> = {}
    
    fields.forEach(field => {
      if (field.type === 'switch') {
        data[field.id] = formData.get(field.id) === 'on'
      } else {
        data[field.id] = formData.get(field.id)
      }
    })
    
    onSubmit(data)
  }

  const renderField = (field: FormField) => {
    const baseProps = {
      id: field.id,
      name: field.id,
      required: field.required,
      placeholder: field.placeholder
    }

    switch (field.type) {
      case 'textarea':
        return <Textarea {...baseProps} />

      case 'select':
        return (
          <Select name={field.id}>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'switch':
        return <Switch id={field.id} name={field.id} />

      default:
        return <Input {...baseProps} type={field.type} />
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
      {fields.map((field) => (
        <div key={field.id} className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.type === 'switch' && renderField(field)}
          </div>

          {field.type !== 'switch' && renderField(field)}

          {field.description && (
            <p className="text-sm text-muted-foreground">{field.description}</p>
          )}
        </div>
      ))}

      <Button type="submit" className="w-full gap-2">
        <Wand2 className="h-4 w-4" />
        {submitLabel}
      </Button>
    </form>
  )
}