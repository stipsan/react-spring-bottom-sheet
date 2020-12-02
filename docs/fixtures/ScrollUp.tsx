import cx from 'classnames'
import { forwardRef } from 'react'
import styles from './ScrollUp.module.css'

const ScrollUp = forwardRef<
  HTMLButtonElement,
  Omit<React.PropsWithoutRef<JSX.IntrinsicElements['button']>, 'children'>
>(({ className, ...props }, ref) => (
  <button
    className={cx(
      'mx-auto w-12 h-12 rounded-full grid place-items-center group transition-colors duration-150',
      'bg-current text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-white hover:text-gray-500',
      className
    )}
    {...props}
    aria-label="Scroll to top"
    title="Click to scroll back up"
    ref={ref}
  >
    <span
      className={cx(styles.up, 'text-gray-800 group-hover:text-gray-900')}
    />
  </button>
))

export default ScrollUp
