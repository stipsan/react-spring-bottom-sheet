export default function Nugget({
  heading,
  lead,
}: {
  heading: React.ReactNode
  lead: React.ReactNode
}) {
  return (
    <article className="">
      <h2 className="text-2xl text-gray-900 font-display">{heading}</h2>
      <p className="text-1xl px-0.5 text-left">{lead}</p>
    </article>
  )
}
