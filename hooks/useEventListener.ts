import * as React from "react"

type ListenerCallback = (event: any) => void

export function useEventListener(
  eventName: string,
  handler: ListenerCallback,
  element: any = typeof window !== "undefined" ? window : undefined
) {
  // Create a ref that stores handler
  const savedHandler = React.useRef<ListenerCallback | null>(null)

  // Update ref.current value if handler changes
  React.useEffect(() => {
    savedHandler.current = handler
  }, [handler])

  React.useEffect(() => {
    // Make sure element supports addEventListener
    const isSupported = element && element.addEventListener
    if (!isSupported) return

    // Create event listener that calls handler function stored in ref
    const eventListener = (event: any) => savedHandler.current!(event)

    element.addEventListener(eventName, eventListener)

    // Remove event listener on cleanup
    return () => {
      element.removeEventListener(eventName, eventListener)
    }
  }, [eventName, element])
}

