import cx from 'classnames'
import Link from 'next/link'
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
    <article className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <div>
        <div className="grid grid-flow-row place-items-start gap-2.5 sticky top-5 mb-5">
          <h2 className="text-5xl text-hero font-display">{heading}</h2>
          <p className="text-2xl px-0.5">{lead}</p>

          <Link href={example}>
            <a className="px-2 py-0 rounded-full transition-colors duration-150 focus:duration-0 bg-hero-lighter text-hero hover:bg-hero hover:text-hero-lighter focus:outline-none focus:bg-hero focus:text-hero-lighter focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-hero">
              Go to example
            </a>
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
      <div className={cx(styles.example, { 'sm:order-first': flip })}>
        <div className={styles.phoneframe}>
          {active && (
            <iframe
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
                  : 'z-10 bg-black text-white hover:text-gray-900 hover:bg-gray-100 focus:text-gray-900 focus:bg-gray-100 active:bg-white',
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
