import { useDebugValue, useEffect, useMemo, useRef } from 'react'

export function useReducedMotion() {
  const mql = useMemo(
    () =>
      typeof window !== 'undefined' && 'matchMedia' in window
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null,
    []
  )
  const ref = useRef(mql?.matches ?? false)

  useDebugValue(ref.current ? 'reduce' : 'no-preference')

  useEffect(() => {
    if (!mql) return

    const handler = (event: MediaQueryListEvent) => {
      ref.current = event.matches
    }
    if ('addEventListener' in mql) {
      mql.addEventListener('change', handler)
      return () => mql.removeEventListener('change', handler)
    }
    // Safari < 14
    ;(mql as MediaQueryList).addListener(handler)
    return () => (mql as MediaQueryList).removeListener(handler)
  }, [mql])

  return ref
}
