import { useEffect, useLayoutEffect as useLayoutEffectSafely } from 'react'

// Ensure the name used in components is useLayoutEffect so the eslint react hooks plugin works
export const useLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffectSafely : useEffect
