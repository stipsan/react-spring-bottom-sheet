import cx from 'classnames'
import { forwardRef } from 'react'
import styles from './Button.module.css'

type Props = {
  textSize?: string
  padding?: string
  children: React.ReactNode
} & Omit<React.PropsWithoutRef<JSX.IntrinsicElements['button']>, 'children'>

const Button = forwardRef<HTMLButtonElement, Props>(
  (
    { className, textSize = 'text-xl', padding = 'px-7 py-3', ...props },
    ref
  ) => (
    <button
      className={cx(
        styles.rounded,
        textSize,
        padding,
        'rounded-2xl border-solid border-gray-300 border-2',
        'transition-colors duration-150 focus-visible:duration-0',
        'bg-gray-100 text-gray-900 hover:bg-gray-300 focus-visible:bg-gray-300',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:ring-gray-300',
        className
      )}
      {...props}
      ref={ref}
    />
  )
)

export default Button
