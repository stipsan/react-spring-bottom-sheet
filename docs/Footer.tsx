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
      <span className="block pl-3 pr-2 py-1 text-white bg-gray-800 rounded-l-md">
        {name}
      </span>
      <span className="block pr-3 pl-2 py-1 bg-hero-lighter text-black rounded-r-md">
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
    <footer className="px-10 py-32 grid md:grid-flow-col md:place-items-center place-content-center gap-8 relative">
      <div
        className={cx(
          styles.skewed,
          'absolute top-0 right-0 bottom-0 bg-gray-900 w-screen'
        )}
      />
      <Badge name="react-spring-bottom-sheet" version={version} />
      <Badge name="react-spring" version={reactSpringVersion} />
      <Badge name="react-use-gesture" version={reactUseGestureVersion} />
    </footer>
  )
}
