import cx from 'classnames'
import { forwardRef } from 'react'
import styles from './SnapMarker.module.css'

const SnapMarker = forwardRef<
  HTMLSpanElement,
  Omit<React.PropsWithoutRef<JSX.IntrinsicElements['span']>, 'children'>
>(({ className, ...props }, ref) => (
  <span
    className={cx(
      styles.point,
      'absolute left-0 z-10 w-0 h-0 pointer-events-none',
      className
    )}
    {...props}
    ref={ref}
  />
))

export default SnapMarker
