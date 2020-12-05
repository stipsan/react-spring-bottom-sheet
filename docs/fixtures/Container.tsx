import cx from 'classnames/dedupe'
import { useEffect } from 'react'
import { useDetectEnv } from './hooks'
import CloseExample from './CloseExample'

export default function Container({
  children,
  className,
}: {
  children: React.ReactNode
  className?: Parameters<typeof cx>[0]
}) {
  const env = useDetectEnv()
  useEffect(() => {
    const className = cx({
      'is-window': env === 'window',
      'is-iframe': env === 'iframe',
    })
    document.documentElement.classList.add(className)
    return () => {
      document.documentElement.classList.remove(className)
    }
  }, [env])

  return (
    <main
      className={cx(
        'grid place-content-evenly min-h-screen bg-white',
        className
      )}
    >
      <CloseExample />
      {children}
    </main>
  )
}
