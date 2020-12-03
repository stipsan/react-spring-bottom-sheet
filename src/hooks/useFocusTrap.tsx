import { createFocusTrap } from 'focus-trap'
import { useDebugValue, useEffect, useRef } from 'react'

export function useFocusTrap({
  targetRef,
  fallbackRef,
  initialFocusRef,
  enabled,
}: {
  targetRef: React.RefObject<HTMLElement>
  fallbackRef: React.RefObject<HTMLElement>
  initialFocusRef?: React.RefObject<HTMLElement>
  enabled: boolean
}) {
  const ref = useRef<{ activate: () => void; deactivate: () => void }>({
    activate: () => {
      throw new TypeError('Tried to activate focus trap too early')
    },
    deactivate: () => {},
  })

  useDebugValue(enabled ? 'Enabled' : 'Disabled')

  useEffect(() => {
    if (!enabled) {
      ref.current.deactivate()
      ref.current = { activate: () => {}, deactivate: () => {} }
      return
    }

    const fallback = fallbackRef.current
    const trap = createFocusTrap(targetRef.current, {
      onActivate:
        process.env.NODE_ENV !== 'production'
          ? () => {
              console.log('focus activate')
            }
          : undefined,
      // If initialFocusRef is manually specified we don't want the first tabbable element to receive focus if initialFocusRef can't be found
      initialFocus: initialFocusRef
        ? () => initialFocusRef?.current || fallback
        : undefined,
      fallbackFocus: fallback,
      escapeDeactivates: false,
      clickOutsideDeactivates: false,
    })
    let active = false

    ref.current = {
      activate: async () => {
        if (active) return
        active = true

        await trap.activate()
        return new Promise((resolve) =>
          requestAnimationFrame(() => resolve(void 1))
        )
      },
      deactivate: () => {
        if (!active) return
        active = false

        trap.deactivate()
      },
    }
  }, [enabled, fallbackRef, initialFocusRef, targetRef])

  return ref
}
