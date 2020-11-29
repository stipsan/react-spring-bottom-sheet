import styles from './StickyNugget.module.css'

export default function StickyNugget({
  heading,
  lead,
  example,
}: {
  heading: React.ReactNode
  lead: React.ReactNode
  example: string
}) {
  return (
    <article>
      <h2>{heading}</h2>
      <p>{lead}</p>
      <div style={{ maxWidth: '428px' }}>
        <div className={styles.phoneframe}>
          <iframe src={example} allowTransparency />
        </div>
      </div>
    </article>
  )
}
