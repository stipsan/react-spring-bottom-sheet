import type { InferGetStaticPropsType } from 'next'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { capitalize } from '../docs/utils'

import '../docs/style.css'
import '../src/style.css'

export async function getStaticProps() {
  const { version, description, homepage, name, meta = {} } = await import(
    '../package.json'
  )
  if (!meta['og:site_name']) {
    meta['og:site_name'] = capitalize(name)
  }

  return { props: { version, description, homepage, name, meta } }
}

export type GetStaticProps = InferGetStaticPropsType<typeof getStaticProps>

export default function _AppPage({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width,viewport-fit=cover" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}
