/**
 * The BottomSheet instances used in the iframe examples have certain adaptations that only makes sense
 * in the context of the SVG wrappers. Like the behavior with maxHeight and more.
 * This wrapper ensures that these details don't leak into the example code.
 */

import { forwardRef } from 'react'
import { BottomSheetRef, BottomSheet } from '../../src'

const FixtureBottomSheet = forwardRef<
  BottomSheetRef,
  React.ComponentProps<typeof BottomSheet>
>((props, ref) => {
  return <BottomSheet {...props} ref={ref} />
})

export default FixtureBottomSheet
