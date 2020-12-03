/* eslint-disable react/jsx-pascal-case */
import Portal from '@reach/portal'
import React, { forwardRef, useRef, useState } from 'react'
import { BottomSheet as _BottomSheet } from './BottomSheet'
import type { Props, RefHandles } from './types'
import { useLayoutEffect } from './hooks'

export type { RefHandles as BottomSheetRef } from './types'

// Because SSR is annoying to deal with, and all the million complaints about window, navigator and dom elenents!
export const BottomSheet = forwardRef<RefHandles, Props>((props, ref) => {
  const [mounted, setMounted] = useState(false)
  // Workaround annoying race condition
  const openRef = useRef(props.open)

  // Using layout effect to support cases where the bottom sheet have to appear already open, no transition
  useLayoutEffect(() => {
    setMounted(true)
  }, [])

  return (
    <Portal data-rsbs-portal>
      {mounted && <_BottomSheet {...props} openRef={openRef} ref={ref} />}
    </Portal>
  )
})
