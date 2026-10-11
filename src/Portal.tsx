import { useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'

// Renders children into an element appended to document.body, so the sheet isn't clipped
// by ancestor overflow or transforms. Replaces the unmaintained @reach/portal.
//
// The container is created in a lazy state initializer rather than in an effect: rendering
// into a detached node and attaching it afterwards avoids the extra render (and the
// placeholder element) that the create-then-forceUpdate approach needs.

const canUseDOM = () =>
  typeof window !== 'undefined' &&
  typeof window.document?.createElement === 'function'

export function Portal({
  children,
  type = 'reach-portal',
  ...props
}: {
  children: React.ReactNode
  /** Tag name used for the container element */
  type?: string
} & Record<`data-${string}`, string | boolean | undefined>) {
  const [node] = useState(() =>
    canUseDOM() ? document.createElement(type) : null
  )

  useLayoutEffect(() => {
    if (!node) return

    for (const [key, value] of Object.entries(props)) {
      if (value !== undefined && value !== false) {
        node.setAttribute(key, value === true ? '' : String(value))
      }
    }

    document.body.appendChild(node)
    return () => {
      node.remove()
    }
    // Attributes are static in practice; re-running on every prop identity change
    // would detach and reattach the sheet mid-animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node])

  return node ? createPortal(children, node) : null
}
