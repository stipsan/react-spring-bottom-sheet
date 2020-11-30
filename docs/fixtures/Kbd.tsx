import cx from 'classnames'
import { forwardRef } from 'react'
import styles from './Code.module.css'

type Props = {
  children: React.ReactNode
} & Omit<React.PropsWithoutRef<JSX.IntrinsicElements['kbd']>, 'children'>

// @TODO style properly

const Kbd = forwardRef<HTMLElement, Props>(({ className, ...props }, ref) => (
  <kbd
    className={cx(styles.text, 'text-gray-700 inline-block', className)}
    {...props}
    ref={ref}
  />
))

export default Kbd
