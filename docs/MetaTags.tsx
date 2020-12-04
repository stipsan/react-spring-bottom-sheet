import Head from 'next/head'

export default function MetaTags({
  homepage,
  description,
  name,
  title,
  ...props
}: {
  homepage?: string
  description?: string
  name: string
  title?: string
  ['twitter:title']?: string | false
  ['og:title']?: string | false
  ['og:site_name']?: string | false
  ['twitter:image:src']?: string | false
  ['og:image']?: string | false
}) {
  const fallbackTitle = `$ npm i ${name}`
  const twitterTitle =
    props['twitter:title'] ?? (props['og:title'] || fallbackTitle)
  const ogTitle = props['og:title'] ?? (props['twitter:title'] || fallbackTitle)
  const twitterImage = props['twitter:image:src'] ?? props['og:image']
  const ogImage = props['og:image'] ?? props['twitter:image:src']
  const ogSiteName = props['og:site_name'] ?? name
  const twitterSite = props['twitter:site']
  const twitterDescription = props['twitter:description'] ?? description

  return (
    <Head>
      <title key="title">
        {title ? `${title} | ` : null}
        {props['og:site_name'] ?? name}
      </title>
      {description && (
        <meta key="description" name="description" content={description} />
      )}
      {twitterSite && (
        <>
          {twitterImage && (
            <meta
              key="twitter:image:src"
              name="twitter:image:src"
              content={twitterImage}
            />
          )}
          {twitterSite && (
            <meta
              key="twitter:site"
              name="twitter:site"
              content={twitterSite}
            />
          )}
          <meta
            key="twitter:card"
            name="twitter:card"
            content="summary_large_image"
          />
          {twitterTitle && (
            <meta
              key="twitter:title"
              name="twitter:title"
              content={twitterTitle}
            />
          )}
          {twitterDescription && (
            <meta
              key="twitter:description"
              name="twitter:description"
              content={twitterDescription}
            />
          )}
        </>
      )}
      {homepage && (
        <>
          {ogImage && (
            <meta key="og:image" property="og:image" content={ogImage} />
          )}
          {ogSiteName && (
            <meta
              key="og:site_name"
              property="og:site_name"
              content={ogSiteName}
            />
          )}
          <meta key="og:type" property="og:type" content="object" />
          {ogTitle && (
            <meta key="og:title" property="og:title" content={ogTitle} />
          )}
          <meta key="og:url" property="og:url" content={homepage} />
          <meta
            key="og:description"
            property="og:description"
            content={description}
          />
          <link key="canonical" rel="canonical" href={homepage} />
        </>
      )}
    </Head>
  )
}
