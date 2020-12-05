import cx from 'classnames/dedupe'
import { useEffect } from 'react'
import { useDetectEnv } from './hooks'
import Link from 'next/link'

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
      <Link href="/">
        <a className="z-10 absolute left-0 top-0 only-window my-4 mx-8 py-2 px-4 transition-colors focus:duration-0 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-600 hover:text-gray-700 active:text-gray-800 text-xs rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:ring-gray-400">
          Close example
        </a>
      </Link>
      {children}
    </main>
  )
}
