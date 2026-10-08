"use client"

import * as React from "react"
import type { Control } from "react-hook-form"
import { useController } from "react-hook-form"

const Form = React.forwardRef<
  HTMLFormElement,
  React.HTMLAttributes<HTMLFormElement>
>(({ className, ...props }, ref) => (
  <form ref={ref} className={className} {...props} />
))
Form.displayName = "Form"

const FormLabel = React.forwardRef<
  React.ElementRef<"label">,
  React.ComponentPropsWithoutRef<"label">
>(({ className, ...props }, ref) => (
  <label ref={ref} className={className} {...props} />
))
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={className} {...props} />
))
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef<
  React.ElementRef<"p">,
  React.ComponentPropsWithoutRef<"p">
>(({ className, ...props }, ref) => (
  <p ref={ref} className={className} {...props} />
))
FormDescription.displayName = "FormDescription"

const FormItem = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div ref={ref} className={className} {...props} />
))
FormItem.displayName = "FormItem"

type FormFieldProps = React.HTMLAttributes<HTMLDivElement> & {
  control: Control<any>
  // react-hook-form accepts a complex name type; we use string here
  name: string
  render?: (methods: { field: any }) => React.ReactNode
  children?: (methods: { field: any }) => React.ReactNode
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ render, children, control, name, ...props }, ref) => {
    const { field } = useController({ control, name: name as any })
    const content = (render ?? children)?.({ field })
    return (
      <div ref={ref} {...props}>
        {content}
      </div>
    )
  }
)
FormField.displayName = "FormField"


const FormMessage = React.forwardRef<
  React.ElementRef<"p">,
  React.ComponentPropsWithoutRef<"p">
>(({ className, children = "*", ...props }, ref) => {
  const body = children

  if (!body) return null

  return (
    <p ref={ref} className={className} {...props}>
      {body}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

export {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormField,
  FormMessage,
}

