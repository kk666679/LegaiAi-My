"use client"

import * as React from "react";
import { useFormState } from "react-dom";

const FormFieldContext = React.createContext<{
  name?: string
}>({
  name: undefined,
})

function useFormField() {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)

  return {
    name: fieldContext.name,
    ...itemContext,
  }
}

interface FormItemContextValue {
  id: string
  formDescriptionId: string
  formItemId: string
  formMessageId: string
}

const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue)

export { useFormField }
