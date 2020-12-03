/* eslint-disable react/jsx-pascal-case */
import Portal from '@reach/portal'
import React, { forwardRef, useRef, useState } from 'react'
import { BottomSheet as _BottomSheet } from './BottomSheet'
import type { Props, RefHandles, SpringEvent } from './types'
import { useLayoutEffect } from './hooks'

export type { RefHandles as BottomSheetRef } from './types'

// Because SSR is annoying to deal with, and all the million complaints about window, navigator and dom elenents!
export const BottomSheet = forwardRef<RefHandles, Props>(function BottomSheet(
  props,
  ref
) {
  // Mounted state, helps SSR but also ensures you can't tab into the sheet while it's closed, or nav there in a screen reader
  const [mounted, setMounted] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  // The last point that the user snapped to, useful for open/closed toggling and the user defined height is remembered
  const lastSnapRef = useRef(null)
  // Workaround annoying race condition
  const openRef = useRef(props.open)

  // Using layout effect to support cases where the bottom sheet have to appear already open, no transition
  useLayoutEffect(() => {
    if (props.open) {
      clearTimeout(timerRef.current)
      setMounted(true)
    }
  }, [props.open])

  function onSpringStart(event: SpringEvent) {
    // Forward the event
    props.onSpringStart?.(event)

    if (event.type === 'OPEN') {
      // Ensures that when it's opening we abort any pending unmount action
      clearTimeout(timerRef.current)
    }
  }

  function onSpringEnd(event: SpringEvent) {
    // Forward the event
    props.onSpringEnd?.(event)

    if (event.type === 'CLOSE') {
      // Unmount from the dom to avoid contents being tabbable or visible to screen readers while closed
      timerRef.current = setTimeout(() => setMounted(false), 1000)
    }
  }

  return (
    <Portal data-rsbs-portal>
      {mounted && (
        <_BottomSheet
          {...props}
          openRef={openRef}
          lastSnapRef={lastSnapRef}
          ref={ref}
          onSpringStart={onSpringStart}
          onSpringEnd={onSpringEnd}
        />
      )}
    </Portal>
  )
})
