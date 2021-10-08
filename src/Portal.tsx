import { useEffect, useRef } from 'react'
import { render, unmountComponentAtNode } from 'react-dom'

// If we use classic portal implementation all the events will be
// bubbling to children
// And we want to prevent it
// for being able to render a bottom sheet inside another one
// @see https://github.com/facebook/react/issues/11387#issuecomment-675115236
export const Portal = ({ children }) => {
  const containerRef = useRef<Node>(null)

  useEffect(() => {
    const container = document.createElement('div')
    container.setAttribute('data-rsbs-portal', '')
    containerRef.current = container
    document.body.appendChild(container)
    return () => {
      unmountComponentAtNode(container)
      document.body.removeChild(container)
    }
  }, [])

  useEffect(() => {
    render(children, containerRef.current)
  }, [children])

  return null
}
