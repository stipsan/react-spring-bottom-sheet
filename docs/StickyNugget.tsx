import cx from 'classnames'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import styles from './StickyNugget.module.css'

export default function StickyNugget({
  flip = false,
  heading,
  lead,
  example,
  text = 'text-gray-800',
  bg = 'bg-gray-100',
}: {
  flip?: boolean
  heading: string
  lead: React.ReactNode
  example: string
  bg?: string
  text?: string
}) {
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const active = loading || loaded

  useEffect(() => {
    if (loaded && loading) {
      const timeout = setTimeout(() => setLoading(false), 900)
      return () => {
        clearTimeout(timeout)
      }
    }
  }, [loaded, loading])

  return (
    <article
      className={cx('grid grid-cols-1 md:grid-cols-2 gap-5 relative py-20', {
        'md:pt-40': !flip,
        'md:pb-40': flip,
      })}
    >
      <div
        className={cx('absolute top-0 right-0 bottom-0', styles.fancybg, bg)}
      />
      <div>
        <div className="grid grid-flow-row place-items-start gap-2.5 sticky top-5 mb-5">
          <h2 className={cx('text-5xl font-display', text)}>{heading}</h2>
          {[].concat(lead).map((lead, i) => (
            <p key={`lead-${i}`} className="text-2xl px-0.5">
              {lead}
            </p>
          ))}

          <Link
            href={example}
            className="underline-none hover:underline focus:underline text-2xl  font-bold text-gray-700 hover:text-gray-800 active:text-gray-900 focus:outline-none"
          >
            Open example 👀
          </Link>
          {process.env.NODE_ENV !== 'production' && active && (
            <button
              className=" bg-gray-300 text-gray-800 px-2 py-0 rounded-full"
              onClick={() => {
                setLoading(false)
                setLoaded(false)
              }}
            >
              Close example
            </button>
          )}
        </div>
      </div>
      <div
        className={cx(styles.example, {
          'md:order-first': flip,
        })}
      >
        <div className={styles.phoneframe}>
          {active && (
            <iframe
              title={heading}
              className={cx('z-10 transition-opacity duration-300', {
                'opacity-0': !loaded,
              })}
              src={example}
              onLoad={() => loading && setLoaded(true)}
            />
          )}
          {(!loaded || loading) && (
            <button
              className={cx(
                styles.loader,
                loading
                  ? 'z-0 transition-all bg-white text-gray-900'
                  : 'z-10 bg-black text-gray-200 hover:text-gray-900 hover:bg-gray-100 focus-visible:text-gray-900 focus-visible:bg-gray-100 active:bg-white',
                loaded && 'opacity-0',
                'flex justify-center items-center flex-col absolute',
                'focus:outline-none transition-colors duration-150 group'
              )}
              onClick={() => setLoading(true)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                focusable="false"
                className="w-40 pb-6"
                role="img"
                viewBox="0 0 512 512"
              >
                <path
                  fill="currentColor"
                  d="M371.7 238l-176-107c-15.8-8.8-35.7 2.5-35.7 21v208c0 18.4 19.8 29.8 35.7 21l176-101c16.4-9.1 16.4-32.8 0-42zM504 256C504 119 393 8 256 8S8 119 8 256s111 248 248 248 248-111 248-248zm-448 0c0-110.5 89.5-200 200-200s200 89.5 200 200-89.5 200-200 200S56 366.5 56 256z"
                />
              </svg>
              <span className="group-focus:ring-2 group-focus:ring-current px-4 py-2 rounded-full font-bold text-lg">
                {loading ? 'Loading example…' : 'Load example'}
              </span>
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
