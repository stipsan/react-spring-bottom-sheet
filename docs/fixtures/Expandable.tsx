export default function Expandable({
  children,
  summary = 'Tap to expand',
}: {
  children: React.ReactNode
  summary?: React.ReactNode
}) {
  return (
    <details className=" text-xl px-7 py-3 rounded-2xl transition-colors duration-150 focus-within:duration-0 bg-gray-100 text-gray-900 focus:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-white focus-within:ring-gray-300 w-full">
      <summary className="focus:outline-none">{summary}</summary>

      {children}
    </details>
  )
}
