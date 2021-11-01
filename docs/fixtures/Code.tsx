import cx from 'classnames'
import { forwardRef } from 'react'
// import styles from './Code.module.css'
const styles = {}

type Props = {
  children: React.ReactNode
} & Omit<React.PropsWithoutRef<JSX.IntrinsicElements['code']>, 'children'>

const Code = forwardRef<HTMLElement, Props>(({ className, ...props }, ref) => (
  <code
    className={cx(styles.text, 'text-red-700 inline-block', className)}
    {...props}
    ref={ref}
  />
))

export default Code
