import cx from 'classnames'
import { useEffect } from 'react'
import { useDetectEnv } from './hooks'

export default function Container({ children }: { children: React.ReactNode }) {
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
    <main className="grid place-content-evenly min-h-screen bg-white">
      {children}
    </main>
  )
}
