import cx from 'classnames'
import { forwardRef } from 'react'
import styles from './ScrollUp.module.css'

const ScrollUp = forwardRef<
  HTMLButtonElement,
  Omit<React.PropsWithoutRef<JSX.IntrinsicElements['button']>, 'children'>
>(({ className, ...props }, ref) => (
  <button
    className={cx('', className)}
    {...props}
    aria-label="Scroll to top"
    ref={ref}
  >
    <span className={cx(styles.up)} />
  </button>
))

export default ScrollUp
