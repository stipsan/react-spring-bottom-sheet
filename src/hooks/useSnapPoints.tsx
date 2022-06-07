import type { BottomSheetMachineHook } from '@bottom-sheet/react-hooks'
import type { ResizeObserverEntry } from '@juggle/resize-observer'
import { ResizeObserver } from '@juggle/resize-observer'
import type { ResizeObserverOptions } from '@juggle/resize-observer/lib/ResizeObserverOptions'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'

import type { ResizeSource } from '../types'
import { roundAndCheckForNaN } from '../utils'
import { useReady } from './useReady'

export function useDimensions({
  dispatch,
  state,
  contentRef,
  controlledMaxHeight,
  footerEnabled,
  footerRef,
  headerEnabled,
  headerRef,
  registerReady,
  resizeSourceRef,
}: {
  dispatch: BottomSheetMachineHook['dispatch']
  state: BottomSheetMachineHook['state']
  contentRef: React.RefObject<Element>
  controlledMaxHeight?: number
  footerEnabled: boolean
  footerRef: React.RefObject<Element>
  headerEnabled: boolean
  headerRef: React.RefObject<Element>
  registerReady: ReturnType<typeof useReady>['registerReady']
  resizeSourceRef: React.MutableRefObject<ResizeSource>
}): void {
  const setReady = useMemo(
    () => registerReady('contentHeight'),
    [registerReady]
  )
  useMaxHeight(
    dispatch,
    state,
    controlledMaxHeight,
    registerReady,
    resizeSourceRef
  )

  useElementSizeObserver(headerRef, {
    enabled: headerEnabled,
    onChange: useCallback(
      (headerHeight) => {
        resizeSourceRef.current = 'element'
        dispatch({
          type: 'SET_HEADER_HEIGHT',
          payload: { headerHeight },
        })
      },
      [dispatch, resizeSourceRef]
    ),
  })
  useElementSizeObserver(contentRef, {
    enabled: true,
    onChange: useCallback(
      (contentHeight) => {
        resizeSourceRef.current = 'element'
        dispatch({
          type: 'SET_CONTENT_HEIGHT',
          payload: { contentHeight },
        })
      },
      [dispatch, resizeSourceRef]
    ),
  })
  useElementSizeObserver(footerRef, {
    enabled: footerEnabled,
    onChange: useCallback(
      (footerHeight) => {
        resizeSourceRef.current = 'element'
        dispatch({
          type: 'SET_FOOTER_HEIGHT',
          payload: { footerHeight },
        })
      },
      [dispatch, resizeSourceRef]
    ),
  })

  const ready = state.context.contentHeight > 0
  useEffect(() => {
    if (ready) {
      setReady()
    }
  }, [ready, setReady])
}

const observerOptions: ResizeObserverOptions = {
  // Respond to changes to padding, happens often on iOS when using env(safe-area-inset-bottom)
  // And the user hides or shows the Safari browser toolbar
  box: 'border-box',
}
/**
 * Hook for determining the size of an element using the Resize Observer API.
 *
 * @param ref - A React ref to an element
 */
function useElementSizeObserver(
  ref: React.RefObject<Element>,
  {
    enabled,
    onChange,
  }: {
    enabled: boolean
    onChange: (value: number) => void
  }
): void {
  useEffect(() => {
    if (!ref.current || !enabled) {
      return
    }

    const handleResize = (entries: ResizeObserverEntry[]) => {
      // we only observe one element, so accessing the first entry here is fine
      onChange(entries[0].borderBoxSize[0].blockSize)
    }
    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(ref.current, observerOptions)

    return () => resizeObserver.disconnect()
  }, [enabled, onChange, ref])
}

// Blazingly keep track of the current viewport height without blocking the thread, keeping that sweet 60fps on smartphones
function useMaxHeight(
  dispatch: BottomSheetMachineHook['dispatch'],
  state: BottomSheetMachineHook['state'],
  controlledMaxHeight: number | undefined,
  registerReady: ReturnType<typeof useReady>['registerReady'],
  resizeSourceRef: React.MutableRefObject<ResizeSource>
): void {
  const setReady = useMemo(() => registerReady('maxHeight'), [registerReady])
  const ready = state.context.maxHeight > 0
  const raf = useRef(0)

  useEffect(() => {
    if (ready) {
      setReady()
    }
  }, [ready, setReady])

  useEffect(() => {
    // Bail if the max height is a controlled prop
    if (controlledMaxHeight) {
      dispatch({
        type: 'SET_MAX_HEIGHT',
        payload: { maxHeight: roundAndCheckForNaN(controlledMaxHeight) },
      })
      resizeSourceRef.current = 'maxheightprop'

      return
    }

    const handleResize = () => {
      if (raf.current) {
        // bail to throttle the amount of resize changes
        return
      }

      // throttle state changes using rAF
      raf.current = requestAnimationFrame(() => {
        dispatch({
          type: 'SET_MAX_HEIGHT',
          payload: { maxHeight: window.innerHeight },
        })
        resizeSourceRef.current = 'window'

        raf.current = 0
      })
    }
    window.addEventListener('resize', handleResize)
    dispatch({
      type: 'SET_MAX_HEIGHT',
      payload: { maxHeight: window.innerHeight },
    })
    resizeSourceRef.current = 'window'
    setReady()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(raf.current)
    }
  }, [controlledMaxHeight, dispatch, resizeSourceRef, setReady])
}
