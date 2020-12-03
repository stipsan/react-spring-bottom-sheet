import { useDebugValue, useEffect, useMemo, useRef } from 'react'

// @TODO refactor to addEventListener
export function useReducedMotion() {
  const mql = useMemo(
    () =>
      typeof window !== 'undefined'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null,
    []
  )
  const ref = useRef(mql?.matches)

  useDebugValue(ref.current ? 'reduce' : 'no-preference')

  useEffect(() => {
    const handler = (event) => {
      ref.current = event.matches
    }
    mql?.addListener(handler)

    return () => mql?.removeListener(handler)
  }, [mql])

  return ref
}
