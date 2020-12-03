import React, { useDebugValue, useEffect, useRef } from 'react'

// Handle hiding and restoring aria-hidden attributes
export function useAriaHider({
  targetRef,
  enabled,
}: {
  targetRef: React.RefObject<Element>
  enabled: boolean
}) {
  const ref = useRef<{ activate: () => void; deactivate: () => void }>({
    activate: () => {
      throw new TypeError('Tried to activate aria hider too early')
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

    const target = targetRef.current
    let active = false
    let originalValues: (null | string)[] = []
    let rootNodes: Element[] = []

    ref.current = {
      activate: () => {
        if (active) return
        active = true

        const parentNode = target.parentNode

        document.querySelectorAll('body > *').forEach((node) => {
          if (node === parentNode) {
            return
          }
          let attr = node.getAttribute('aria-hidden')
          let alreadyHidden = attr !== null && attr !== 'false'
          if (alreadyHidden) {
            return
          }
          originalValues.push(attr)
          rootNodes.push(node)
          node.setAttribute('aria-hidden', 'true')
        })
      },
      deactivate: () => {
        if (!active) return
        active = false

        rootNodes.forEach((node, index) => {
          let originalValue = originalValues[index]
          if (originalValue === null) {
            node.removeAttribute('aria-hidden')
          } else {
            node.setAttribute('aria-hidden', originalValue)
          }
        })
        originalValues = []
        rootNodes = []
      },
    }
  }, [targetRef, enabled])

  return ref
}
