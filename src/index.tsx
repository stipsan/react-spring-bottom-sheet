import * as React from 'react'
import Portal from '@reach/portal'

import { DraggableBottomSheet } from './DraggableBottomSheet'
import type { snapPoints, initialHeight, setHeight, SharedProps } from './types'

type BottomSheetProps = {
  /** Whether the bottom sheet is open or not. */
  isOpen: boolean

  /** Handler that is called to get the height values that the bottom sheet can *snap* to when the user stops dragging. The function is given `minHeight`, `maxHeight`, `viewportHeight` and `currentHeight` as arguments. */
  snapPoints?: snapPoints

  /** Handler that is called to get the initial height of the bottom sheet when it's opened (or when the viewport is resized). The function is given `minHeight`, `maxHeight`, `viewportHeight`,`currentHeight` and `snappoints` as arguments. */
  initialHeight?: initialHeight

  /** Handler that is called after the close transition has ended. Use this to know when it's safe to unmount hte bottom sheet. */
  onCloseTransitionEnd?: () => void
} & SharedProps

// @TODO conduct a memo test and see if an state interval is causing unnecessary renders or expensive function creations

// Typings for the forwarded ref, useful as TS can't infer that `setHeight` is available by itself
export type ForwardedRefType = {
  setHeight: setHeight
} & HTMLDivElement

export const BottomSheet = React.forwardRef(
  (
    {
      children,
      className,
      footer,
      header,
      initialFocusRef,
      isOpen: shouldBeOpen,
      onDismiss,
      onCloseTransitionEnd,
      scrollLocking,
      blocking,
      initialHeight = ({ currentHeight, snapPoints }) =>
        Math.max(currentHeight, Math.min(...snapPoints)),
      snapPoints = ({ maxHeight, viewportHeight }) => [
        maxHeight,
        Math.min(Math.max(viewportHeight * 0.7019704433497537, 510), maxHeight),
      ],
      maxWidth,
      marginLeft,
      marginRight,
      backgroundColor,
    }: BottomSheetProps,
    ref: React.Ref<HTMLDivElement>
  ) => {
    const [mounted, setMounted] = React.useState(false)
    // To allow rapid open/close of the same component we force it to always unmount/remount by changing the key
    const [instance, setInstance] = React.useState(0)

    React.useEffect(() => {
      if (shouldBeOpen) {
        if (!mounted) {
          setMounted(true)
        }
        setInstance((instance) => instance + 1)
      }
    }, [shouldBeOpen, mounted])

    // Using refs and callback hooks to ensure the callbacks maintain identity without requiring userland to implement useCallback
    const initialHeightRef = React.useRef(initialHeight)
    initialHeightRef.current = initialHeight
    const initialHeightMemo = React.useCallback(
      (props) => initialHeightRef.current(props),
      []
    )
    const snapPointsRef = React.useRef(snapPoints)
    snapPointsRef.current = snapPoints
    const snapPointsMemo = React.useCallback(
      (props) => snapPointsRef.current(props),
      []
    )

    if (!mounted) {
      return null
    }

    return (
      <Portal data-troika-react-bottom-sheet-wrapper>
        <DraggableBottomSheet
          _onClose={() => {
            setMounted(false)
            if (onCloseTransitionEnd) onCloseTransitionEnd()
          }}
          _shouldClose={!shouldBeOpen}
          ref={ref}
          className={className}
          footer={footer}
          header={header}
          initialFocusRef={initialFocusRef}
          initialHeight={initialHeightMemo}
          key={instance.toString()}
          onDismiss={onDismiss}
          blocking={blocking}
          scrollLocking={scrollLocking}
          snapPoints={snapPointsMemo}
          maxWidth={maxWidth}
          marginLeft={marginLeft}
          marginRight={marginRight}
          backgroundColor={backgroundColor}
        >
          {children}
        </DraggableBottomSheet>
      </Portal>
    )
  }
)
