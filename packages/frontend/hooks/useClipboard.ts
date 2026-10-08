import * as React from "react"

export function useClipboard() {
  const [isCopied, setIsCopied] = React.useState(false)
  const [value, setValue] = React.useState("")

  const copy = React.useCallback(async (text: string) => {
    if (!navigator?.clipboard) {
      console.warn("Clipboard API not supported")
      return false
    }

    try {
      await navigator.clipboard.writeText(text)
      setValue(text)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
      return true
    } catch {
      return false
    }
  }, [])

  const reset = React.useCallback(() => {
    setIsCopied(false)
    setValue("")
  }, [])

  return {
    copy,
    reset,
    isCopied,
    value,
  }
}

