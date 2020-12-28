import { inspect } from '@xstate/inspect'
import type { InferGetStaticPropsType } from 'next'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { capitalize } from '../docs/utils'
import { debugging } from '../src/utils'

import '../docs/style.css'
import '../src/style.css'

// Setup xstate debugging, but only when in dev mode
if (debugging) {
  inspect({
    url: 'https://statecharts.io/inspect',
    iframe: false,
  })
  console.log(
    '@xstate/inspect setup and running! Open https://statecharts.io/inspect in another tab to see the nitty gritty details. It also works with the Redux DevTools, but it lacks chart visualization.'
  )
}

export async function getStaticProps() {
  const [
    { version, description, homepage, name, meta = {} },
    { version: reactSpringVersion },
    { version: reactUseGestureVersion },
  ] = await Promise.all([
    import('../package.json'),
    import('react-spring/package.json'),
    import('react-use-gesture/package.json'),
  ])
  if (!meta['og:site_name']) {
    meta['og:site_name'] = capitalize(name)
  }

  return {
    props: {
      version,
      description,
      homepage,
      name,
      meta,
      reactSpringVersion,
      reactUseGestureVersion,
    },
  }
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
