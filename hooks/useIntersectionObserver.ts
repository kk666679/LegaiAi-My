import * as React from "react"

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean
}

export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  callback: IntersectionObserverCallback,
  options: UseIntersectionObserverOptions = {}
) {
  const frozen = React.useRef<boolean>(false)
  const [targetElement, setTargetElement] = React.useState<Element | null>(null)

React.useEffect(() => {
    if (!ref.current || frozen.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting) {
          frozen.current = options.freezeOnceVisible ?? false
          if (frozen.current) {
            observer.unobserve(ref.current!)
          }
        }
        callback(entries, observer)
      },
      options
    )

    observer.observe(ref.current)
    setTargetElement(ref.current)

    return () => {
      observer.disconnect()
    }
  }, [ref, callback, options])

  return targetElement
}

