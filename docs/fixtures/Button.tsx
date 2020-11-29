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

const Button = forwardRef<HTMLButtonElement, Props>(({ ...props }, ref) => (
  <button {...props} ref={ref} />
))

export default Button
