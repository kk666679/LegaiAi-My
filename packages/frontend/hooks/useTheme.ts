import * as React from "react"
import { useTheme as useNextTheme } from "next-themes"

export function useTheme() {
  const theme = useNextTheme()

  React.useEffect(() => {
    // Ensure theme is hydrated on mount
    if (typeof theme.resolvedTheme === "undefined") {
      theme.setTheme("system")
    }
  }, [theme])

  return {
    theme: theme.theme,
    resolvedTheme: theme.resolvedTheme,
    setTheme: theme.setTheme,
    systemTheme: theme.systemTheme,
  }
}

