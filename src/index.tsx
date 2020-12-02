/* eslint-disable react/jsx-pascal-case */
import Portal from '@reach/portal'
import React, { forwardRef, useEffect, useState } from 'react'
import { BottomSheet as _BottomSheet } from './BottomSheet'
import type { Props, RefHandles } from './types'

export type { RefHandles as BottomSheetRef } from './types'

// Because SSR is annoying to deal with, and all the million complaints about window, navigator and dom elenents!
export const BottomSheet = forwardRef<RefHandles, Props>((props, ref) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <Portal data-rsbs-portal>
      {mounted && <_BottomSheet {...props} ref={ref} />}
    </Portal>
  )
})
