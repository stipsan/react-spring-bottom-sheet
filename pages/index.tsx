import Hero from '../docs/Hero'
import StickyNugget from '../docs/StickyNugget'
import Nugget from '../docs/Nugget'

export default function IndexPage() {
  return (
    <main>
      <Hero />
      <div className="max-w-5xl mx-auto py-10 px-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Nugget heading="Placeholder" lead="Lorem ipsum and so on" />
        <Nugget heading="Placeholder" lead="Lorem ipsum and so on" />
        <Nugget heading="Placeholder" lead="Lorem ipsum and so on" />
      </div>
      <div className="max-w-3xl mx-auto py-10 px-8 grid grid-flow-row gap-y-20">
        <StickyNugget
          heading="Simple Example"
          lead="Intro"
          example="/fixtures/simple"
        />
        <StickyNugget
          flip
          heading="Scrollable Example"
          lead="Intro"
          example="/fixtures/scrollable"
        />
        <StickyNugget
          heading="Sticky Example"
          lead="Intro"
          example="/fixtures/sticky"
        />
        <StickyNugget
          flip
          heading="Aside Example"
          lead="Intro"
          example="/fixtures/aside"
        />
      </div>
    </main>
  )
}
