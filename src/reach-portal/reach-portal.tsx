/**
 * Welcome to @reach/portal!
 *
 * Creates and appends a DOM node to the end of `document.body` and renders a
 * React tree into it. Useful for rendering a natural React element hierarchy
 * with a different DOM hierarchy to prevent parent styles from clipping or
 * hiding content (for popovers, dropdowns, and modals).
 *
 * @see Docs   https://reach.tech/portal
 * @see Source https://github.com/reach/reach-ui/tree/main/packages/portal
 * @see React  https://reactjs.org/docs/portals.html
 */

import * as React from 'react'
import { useIsomorphicLayoutEffect as useLayoutEffect } from './use-isomorphic-layout-effect'

import { useForceUpdate } from './use-force-update'
import { createPortal } from 'react-dom'

/**
 * Portal
 *
 * @see Docs https://reach.tech/portal#portal
 */
const PortalImpl: React.FC<PortalProps> = ({
  children,
  type = 'reach-portal',
  containerRef,
}) => {
  let mountNode = React.useRef<HTMLDivElement | null>(null)
  let portalNode = React.useRef<HTMLElement | null>(null)
  let forceUpdate = useForceUpdate()

  useLayoutEffect(() => {
    // This ref may be null when a hot-loader replaces components on the page
    if (!mountNode.current) return
    // It's possible that the content of the portal has, itself, been portaled.
    // In that case, it's important to append to the correct document element.
    let ownerDocument = mountNode.current!.ownerDocument
    let body = containerRef?.current || ownerDocument.body
    portalNode.current = ownerDocument?.createElement(type)!
    body.appendChild(portalNode.current)
    forceUpdate()
    return () => {
      if (portalNode.current && body) {
        body.removeChild(portalNode.current)
      }
    }
  }, [type, forceUpdate, containerRef])

  return portalNode.current ? (
    createPortal(children, portalNode.current)
  ) : (
    <span ref={mountNode} />
  )
}

const Portal: React.FC<PortalProps> = ({
  unstable_skipInitialRender,
  ...props
}) => {
  let [hydrated, setHydrated] = React.useState(false)
  React.useEffect(() => {
    if (unstable_skipInitialRender) {
      setHydrated(true)
    }
  }, [unstable_skipInitialRender])
  if (unstable_skipInitialRender && !hydrated) {
    return null
  }
  return <PortalImpl {...props} />
}

/**
 * @see Docs https://reach.tech/portal#portal-props
 */
type PortalProps = {
  /**
   * Regular React children.
   *
   * @see Docs https://reach.tech/portal#portal-children
   */
  children: React.ReactNode
  /**
   * The DOM element type to render.
   *
   * @see Docs https://reach.tech/portal#portal-type
   */
  type?: string
  /**
   * The container ref to which the portal will be appended. If not set the
   * portal will be appended to the body of the component's owner document
   * (typically this is the `document.body`).
   *
   * @see Docs https://reach.tech/portal#portal-containerRef
   */
  containerRef?: React.RefObject<Node>
  unstable_skipInitialRender?: boolean
}

Portal.displayName = 'Portal'

////////////////////////////////////////////////////////////////////////////////
// Exports

export type { PortalProps }
export { Portal }
