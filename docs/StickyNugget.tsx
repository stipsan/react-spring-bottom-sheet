import cx from 'classnames'
import { useEffect, useState } from 'react'
import styles from './StickyNugget.module.css'

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
        <div className="sticky top-5 mb-5">
          <h2 className="text-5xl text-hero font-display">{heading}</h2>
          <p className="text-2xl px-0.5">{lead}</p>
          {process.env.NODE_ENV !== 'production' && (
            <button onClick={() => setMounted((mounted) => !mounted)}>
              {mounted ? 'Close iframe' : 'Load iframe'}
            </button>
          )}
        </div>
      </div>
      <div className={cx(styles.example, { 'sm:order-first': flip })}>
        <div className={styles.phoneframe}>
          <iframe src={mounted ? example : undefined} />
        </div>
      </div>
    </article>
  )
}
