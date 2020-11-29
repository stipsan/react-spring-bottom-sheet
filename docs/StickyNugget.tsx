import cx from 'classnames'
import { useEffect, useState } from 'react'
import styles from './StickyNugget.module.css'
import Link from 'next/link'

export default function StickyNugget({
  flip = false,
  heading,
  lead,
  example,
}: {
  flip?: boolean
  heading: React.ReactNode
  lead: React.ReactNode
  example: string
}) {
  // @TODO do a visibility observer thingy
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      setMounted(true)
    }
  }, [])

  return (
    <article className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <div>
        <div className="grid grid-flow-row place-items-start gap-2.5 sticky top-5 mb-5">
          <h2 className="text-5xl text-hero font-display">{heading}</h2>
          <p className="text-2xl px-0.5">{lead}</p>
          {process.env.NODE_ENV !== 'production' && (
            <button
              className=" bg-gray-300 text-gray-800 px-2 py-0 rounded-full"
              onClick={() => setMounted((mounted) => !mounted)}
            >
              {mounted ? 'Close iframe' : 'Load iframe'}
            </button>
          )}
          <Link href={example}>
            <a className="px-2 py-0 rounded-full transition-colors duration-150 focus:duration-0 bg-hero-lighter text-hero hover:bg-hero hover:text-hero-lighter focus:outline-none focus:bg-hero focus:text-hero-lighter focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-hero">
              Go to example
            </a>
          </Link>
        </div>
      </div>
      <div className={cx(styles.example, { 'sm:order-first': flip })}>
        <div className={styles.phoneframe}>
          <iframe
            style={
              process.env.NODE_ENV !== 'production'
                ? { background: mounted ? undefined : 'white' }
                : undefined
            }
            src={mounted ? example : undefined}
          />
        </div>
      </div>
    </article>
  )
}
