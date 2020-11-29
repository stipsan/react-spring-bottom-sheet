export default function Nugget({
  heading,
  lead,
}: {
  heading: React.ReactNode
  lead: React.ReactNode
}) {
  return (
    <article className="md:text-center">
      <h2 className="text-3xl text-hero font-display">{heading}</h2>
      <p className="text-1xl px-0.5">{lead}</p>
    </article>
  )
}
