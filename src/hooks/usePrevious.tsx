import { useEffect, useRef } from 'react'

export function usePrevious<T>(value: T): T {
  const ref = useRef<T>(value)

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}
