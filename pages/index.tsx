import type { NextPage } from 'next'
import { aside, scrollable, simple, sticky } from '../docs/headings'
import Hero from '../docs/Hero'
import Nugget from '../docs/Nugget'
import StickyNugget from '../docs/StickyNugget'
import MetaTags from '../docs/MetaTags'
import type { GetStaticProps } from './_app'

export { getStaticProps } from './_app'

const IndexPage: NextPage<GetStaticProps> = ({
  name,
  version,
  description,
  homepage,
  meta,
}) => (
  <>
    <MetaTags
      {...meta}
      name={name}
      description={description}
      homepage={homepage}
    />
    <main>
      {description}
      <Hero />
      <div className="max-w-5xl mx-auto py-10 px-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Nugget heading="Placeholder" lead="Lorem ipsum and so on" />
        <Nugget heading="Placeholder" lead="Lorem ipsum and so on" />
        <Nugget heading="Placeholder" lead="Lorem ipsum and so on" />
      </div>
      <div className="max-w-4xl mx-auto py-10 px-8 grid grid-flow-row gap-y-20">
        <StickyNugget
          heading={simple}
          lead={[
            "It should be just as intuitive to close the bottom sheet no matter if you're using touch, keyboard navigation, a screen reader or a mouse cursor.",
            'This example is setup to use a single snap point, set to the content height. The sheet adjusts itself accordingly if the content changes.',
          ]}
          example="/fixtures/simple"
        />
        <StickyNugget
          flip
          heading={scrollable}
          lead="Intro"
          example="/fixtures/scrollable"
        />
        <StickyNugget
          heading={sticky}
          lead="Intro"
          example="/fixtures/sticky"
        />
        <StickyNugget
          flip
          heading={aside}
          lead="Intro"
          example="/fixtures/aside"
        />
      </div>
    </main>
  </>
)

export default IndexPage
