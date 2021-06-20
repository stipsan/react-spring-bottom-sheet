import cx from 'classnames'
import styles from './FakeMap.module.css'

const FakeMap = ({
  className,
  ...props
}: {
  className?: string
  onClick?: () => void
}) => <div className={cx(className, styles.map)} {...props} />

export default FakeMap
