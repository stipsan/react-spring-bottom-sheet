import Head from 'next/head'

const TITLE = 'React Spring Bottom Sheet'

export default function HeadTitle({ children }: { children?: string }) {
  return (
    <Head>
      <title>
        {children ? `${children} | ` : null}
        {TITLE}
      </title>
    </Head>
  )
}
