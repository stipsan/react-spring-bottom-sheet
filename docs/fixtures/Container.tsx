export default function Container({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid place-items-center min-h-screen">{children}</main>
  )
}
