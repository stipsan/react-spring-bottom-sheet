import Portal from '@reach/portal'
import * as React from 'react'
import { DraggableBottomSheet } from './Root'
import type { SharedProps } from './types'

export type { ForwardedRefType } from './types'

type BottomSheetProps = {
  /** Whether the bottom sheet is open or not. */
  open: boolean

  /** Handler that is called after the close transition has ended. Use this to know when it's safe to unmount hte bottom sheet. */
  onCloseTransitionEnd?: () => void
} & SharedProps

export const BottomSheet = React.forwardRef(
  (
    {
      children,
      className,
      footer,
      header,
      initialFocusRef,
      open: shouldBeOpen,
      onDismiss,
      onCloseTransitionEnd,
      scrollLocking,
      blocking,
      initialSnapPoint = ({ snapPoints }) => Math.min(...snapPoints),
      snapPoints = ({ maxHeight }) => [maxHeight],
      ...props
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
    const initialSnapPointRef = React.useRef(initialSnapPoint)
    initialSnapPointRef.current = initialSnapPoint
    const initialHeightMemo = React.useCallback(
      (props) => initialSnapPointRef.current(props),
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
          {...props}
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
          initialSnapPoint={initialHeightMemo}
          key={instance.toString()}
          onDismiss={onDismiss}
          blocking={blocking}
          scrollLocking={scrollLocking}
          snapPoints={snapPointsMemo}
        >
          {children}
        </DraggableBottomSheet>
      </Portal>
    )
  }
)
