/* eslint-disable jsx-a11y/alt-text */
import cx from 'classnames'
import { useState } from 'react'

export default function FaviconsPlaygroundPage() {
  const [toggle, setToggle] = useState(false)
  return [
    'favicon',
    'favicon-mini',
    'favicon-frame',
    'favicon-white',
    'favicon-rounded',
  ].map((icon) => (
    <div
      key={icon}
      onClick={() => setToggle((toggle) => !toggle)}
      className={cx(
        'grid place-content-evenly items-center grid-flow-col p-32',
        { 'bg-gray-900': toggle }
      )}
    >
      <img src={`/${icon}-64w.png`} height="16" width="16" />
      <img src={`/${icon}-64w.png`} height="32" width="32" />
      <img src={`/${icon}-64w.png`} height="64" width="64" />
      <img src={`/${icon}.svg`} height="16" width="16" />
      <img src={`/${icon}.svg`} height="32" width="32" />
      <img src={`/${icon}.svg`} height="64" width="64" />
    </div>
  ))
}
