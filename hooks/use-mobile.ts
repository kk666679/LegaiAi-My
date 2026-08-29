import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const query = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`
    const mql = window.matchMedia(query)

    const handleChange = () => {
      setIsMobile(mql.matches)
    }

    // Prefer modern API, fallback for older browsers
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", handleChange)
    } else {
      // Legacy API
      ;(mql as any).addListener(handleChange)
    }

    // Set initial state
    handleChange()

    // Backup resize listener
    const resizeHandler = React.useCallback(() => handleChange(), [])
    window.addEventListener("resize", resizeHandler)

    return () => {
      if (typeof mql.removeEventListener === "function") {
        mql.removeEventListener("change", handleChange)
      } else {
        // Legacy API
        ;(mql as any).removeListener(handleChange)
      }
      window.removeEventListener("resize", resizeHandler)
    }
  }, [])

  return isMobile
}
