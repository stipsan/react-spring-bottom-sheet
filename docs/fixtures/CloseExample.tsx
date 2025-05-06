import cx from 'classnames/dedupe'
import { forwardRef } from 'react'
import Link from 'next/link'

type Props = {
  className?: Parameters<typeof cx>[0]
} & Omit<
  React.PropsWithoutRef<JSX.IntrinsicElements['a']>,
  'children' | 'className'
>

const CloseExample = forwardRef<HTMLAnchorElement, Props>(
  ({ className, ...props }, ref) => (
    <Link
      href="/"
      {...props}
      className={cx(
        'absolute left-0 top-0 only-window my-4 mx-8 py-2 px-4 transition-colors focus:duration-0 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-600 hover:text-gray-700 active:text-gray-800 text-xs rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:ring-gray-400',
        className
      )}
      ref={ref}
    >
      Close example
    </Link>
  )
)

export default CloseExample
