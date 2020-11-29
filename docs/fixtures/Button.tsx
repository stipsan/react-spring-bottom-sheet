import cx from 'classnames'
import { forwardRef } from 'react'

type Props = {
  children: React.ReactNode
  /*onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;*/
} & Omit<
  React.PropsWithoutRef<JSX.IntrinsicElements['button']>,
  // omit children here, because we don't want children to be optional
  'children'
  //'children' | 'onClick'
>

const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, ...props }, ref) => (
    <button
      className={cx(
        'text-xl px-7 py-3 rounded-2xl border-solid border-gray-300 border-2',
        'transition-colors duration-150 focus:duration-0',
        'bg-gray-100 text-gray-900 hover:bg-gray-300 focus:bg-gray-300',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-gray-300',
        className
      )}
      {...props}
      ref={ref}
    />
  )
)

export default Button
