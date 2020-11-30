import cx from 'classnames'
import { forwardRef } from 'react'
import styles from './SheetContent.module.css'

type Props = {
  children: React.ReactNode
} & Omit<React.PropsWithoutRef<JSX.IntrinsicElements['div']>, 'children'>

const SheetContent = forwardRef<HTMLDivElement, Props>(
  ({ className, ...props }: Props, ref) => (
    <div
      className={cx(
        styles.spacing,
        'grid grid-flow-row place-items-start text-gray-900 text-xl',
        'pb-8 px-8 pt-4 gap-4',
        className
      )}
      {...props}
      ref={ref}
    />
  )
)

export default SheetContent
