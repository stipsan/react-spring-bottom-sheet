import Hero from '../docs/Hero'
import StickyNugget from '../docs/StickyNugget'
import Nugget from '../docs/Nugget'
import { Heading as AsideHeading } from './fixtures/aside'

export default function IndexPage() {
  return (
    <main>
      <Hero className="sm:snap-start" />
      <div className="max-w-5xl mx-auto py-10 px-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Nugget heading="Placeholder" lead="Lorem ipsum and so on" />
        <Nugget heading="Placeholder" lead="Lorem ipsum and so on" />
        <Nugget heading="Placeholder" lead="Lorem ipsum and so on" />
      </div>
      <div className="max-w-4xl mx-auto py-10 px-8 grid grid-flow-row gap-y-20">
        <StickyNugget
          heading="Easy to dismiss"
          lead={[
            "It should be just as intuitive to close the bottom sheet no matter if you're using touch, keyboard navigation, a screen reader or a mouse cursor.",
            'This example is setup to use a single snap point, set to the content height. The sheet adjusts itself accordingly if the content changes.',
          ]}
          example="/fixtures/simple"
        />
        <StickyNugget
          flip
          heading="Snap points & overflow"
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
          heading={AsideHeading}
          lead="Intro"
          example="/fixtures/aside"
        />
      </div>
    </main>
  )
}
