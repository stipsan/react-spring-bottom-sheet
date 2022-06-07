import cx from 'classnames'

import styles from './Footer.module.css'

function Badge({
  name,
  version,
}: {
  name: React.ReactNode
  version: React.ReactNode
}) {
  return (
    <a
      className="flex text-sm"
      href={`https://www.npmjs.com/package/${name}/v/${version}`}
    >
      <span className="block py-1 pl-3 pr-2 text-white bg-gray-800 rounded-l-md">
        {name}
      </span>
      <span className="block py-1 pl-2 pr-3 text-black bg-hero-lighter rounded-r-md">
        v{version}
      </span>
    </a>
  )
}

export default function Footer({
  version,
  reactSpringVersion,
  reactUseGestureVersion,
}: {
  version: string
  reactSpringVersion: string
  reactUseGestureVersion: string
}) {
  return (
    <footer className="relative grid gap-8 px-10 py-32 md:grid-flow-col md:place-items-center place-content-center">
      <div
        className={cx(
          styles.skewed,
          'absolute top-0 right-0 bottom-0 bg-gray-900 w-screen'
        )}
      />
      <Badge name="react-spring-bottom-sheet" version={version} />
      <Badge name="@react-spring/web" version={reactSpringVersion} />
      <Badge name="@use-gesture/react" version={reactUseGestureVersion} />
    </footer>
  )
}
