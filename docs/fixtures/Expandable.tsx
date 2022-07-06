export default function Expandable({
  children,
  summary = 'Tap to expand',
}: {
  children: React.ReactNode
  summary?: React.ReactNode
}) {
  return (
    <details className="w-full py-3 text-xl text-gray-900 transition-colors duration-150 bg-gray-100 px-7 rounded-2xl focus-within:duration-0 focus:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-white focus-within:ring-gray-300">
      <summary className="focus:outline-none">{summary}</summary>

      {children}
    </details>
  )
}
