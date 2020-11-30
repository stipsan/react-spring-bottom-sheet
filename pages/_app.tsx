import type { AppProps } from 'next/app'
import Head from 'next/head'
import HeadTitle from '../docs/HeadTitle'

import '../docs/style.css'
import '../src/style.css'

function _AppPage({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, viewport-fit=cover"
        />
      </Head>
      <HeadTitle />
      <Component {...pageProps} />
    </>
  )
}

export default _AppPage
