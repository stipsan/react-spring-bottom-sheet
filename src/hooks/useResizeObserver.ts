// Uses a ResizeObserver to measure the dimensions of an element, if no ref is provided it assumes the hook is disabled

import { useCallback } from 'react'
import { ResizeObserver } from '@juggle/resize-observer'
import { ResizeObserverOptions } from '@juggle/resize-observer/lib/ResizeObserverOptions'
import { useLayoutEffect } from './useLayoutEffect'
import type { SheetEvent } from './useStateMachine'

const observerOptions: ResizeObserverOptions = {
  // Respond to changes to padding, happens often on iOS when using env(safe-area-inset-bottom)
  // And the user hides or shows the Safari browser toolbar
  box: 'border-box',
}

export type onChange = (value: number) => void

export function useResizeObserver(
  ref: React.RefObject<Element> | undefined,
  onChange: onChange
) {
  useLayoutEffect(() => {
    if (ref?.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        // we only observe one element, so accessing the first entry here is fine
        onChange(entries[0].borderBoxSize[0].blockSize)
      })
      resizeObserver.observe(ref.current, observerOptions)

      return () => {
        resizeObserver.disconnect()
      }
    }
    // Nothing to observe, init with 0
    onChange(0)
  }, [ref, onChange])
}

export function useHeaderHeight(
  ref: React.RefObject<Element> | undefined,
  send: (event: SheetEvent) => void
) {
  const onChange = useCallback<onChange>(
    (value) => {
      send({ type: 'HEADER_HEIGHT', value })
    },
    [send]
  )
  useResizeObserver(ref, onChange)
}

export function useContentHeight(
  ref: React.RefObject<Element> | undefined,
  send: (event: SheetEvent) => void
) {
  const onChange = useCallback<onChange>(
    (value) => {
      send({ type: 'CONTENT_HEIGHT', value })
    },
    [send]
  )
  useResizeObserver(ref, onChange)
}

export function useFooterHeight(
  ref: React.RefObject<Element> | undefined,
  send: (event: SheetEvent) => void
) {
  const onChange = useCallback<onChange>(
    (value) => {
      send({ type: 'FOOTER_HEIGHT', value })
    },
    [send]
  )
  useResizeObserver(ref, onChange)
}
