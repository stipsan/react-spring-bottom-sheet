/* eslint-disable react/jsx-pascal-case */
import React, {
  forwardRef,
  useRef,
  useState,
  useCallback,
  useEffect,
} from 'react'
import Portal from '@reach/portal'
import { BottomSheet as _BottomSheet } from './BottomSheet'
import type { Props, RefHandles, SpringEvent } from './types'
import { useLayoutEffect } from './hooks/useLayoutEffect'

export type {
  RefHandles as BottomSheetRef,
  Props as BottomSheetProps,
} from './types'

// Because SSR is annoying to deal with, and all the million complaints about window, navigator and dom elenents!
export const BottomSheet = forwardRef<RefHandles, Props>(function BottomSheet(
  { onSpringStart, onSpringEnd, skipInitialTransition, onClosed, ...props },
  ref
) {
  // Mounted state, helps SSR but also ensures you can't tab into the sheet while it's closed, or nav there in a screen reader
  const [mounted, setMounted] = useState(false)
  const timerRef = useRef<ReturnType<typeof requestAnimationFrame>>()
  // @TODO refactor to an initialState: OPEN | CLOSED property as it's much easier to understand
  // And informs what we should animate from. If the sheet is mounted with open = true, then initialState = OPEN.
  // When initialState = CLOSED, then internal sheet must first render with open={false} before setting open={props.open}
  // It's only when initialState and props.open is mismatching that a intial transition should happen
  // If they match then transitions will only happen when a user interaction or resize event happen.
  const initialStateRef = useRef<'OPEN' | 'CLOSED'>(
    skipInitialTransition && props.open ? 'OPEN' : 'CLOSED'
  )

  // Using layout effect to support cases where the bottom sheet have to appear already open, no transition
  useLayoutEffect(() => {
    if (props.open) {
      cancelAnimationFrame(timerRef.current)
      setMounted(true)

      // Cleanup defaultOpen state on close
      return () => {
        initialStateRef.current = 'CLOSED'
      }
    }
  }, [props.open])

  const handleSpringStart = useCallback(
    async function handleSpringStart(event: SpringEvent) {
      // Forward the event
      await onSpringStart?.(event)

      if (event.type === 'OPEN') {
        // Ensures that when it's opening we abort any pending unmount action
        cancelAnimationFrame(timerRef.current)
      }
    },
    [onSpringStart]
  )

  const handleSpringEnd = useCallback(
    async function handleSpringEnd(event: SpringEvent) {
      // Forward the event
      await onSpringEnd?.(event)

      if (event.type === 'CLOSE') {
        // Unmount from the dom to avoid contents being tabbable or visible to screen readers while closed
        timerRef.current = requestAnimationFrame(() => setMounted(false))
      }
    },
    [onSpringEnd]
  )

  // Working around the fact that handleOnClosed cannot change referencial identity or it will trigger the state machine to restart
  const onClosedRef = useRef(onClosed)
  useEffect(() => {
    onClosedRef.current = onClosed
  }, [onClosed])
  const handleOnClosed = useCallback(() => {
    onClosedRef.current?.()
    setMounted(false)
  }, [])

  // This isn't just a performance optimization, it's also to avoid issues when running a non-browser env like SSR
  if (!mounted) {
    return null
  }

  return (
    <Portal>
      <_BottomSheet
        {...props}
        ref={ref}
        initialState={initialStateRef.current}
        onSpringStart={handleSpringStart}
        onSpringEnd={handleSpringEnd}
        onClosed={handleOnClosed}
      />
    </Portal>
  )
})
