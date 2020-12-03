import cx from 'classnames/dedupe'
import { forwardRef } from 'react'
import styles from './Button.module.css'

type Props = {
  className?: Parameters<typeof cx>[0]
  children: React.ReactNode
} & Omit<
  React.PropsWithoutRef<JSX.IntrinsicElements['button']>,
  'children' | 'className'
>

const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, ...props }, ref) => (
    <button
      className={cx(
        styles.rounded,
        'text-xl px-7 py-3 rounded-2xl border-solid border-gray-300 border-2',
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
