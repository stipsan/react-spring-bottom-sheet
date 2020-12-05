import { aside, scrollable, simple, sticky } from '../docs/headings'
import Footer from '../docs/Footer'
import Hero from '../docs/Hero'
import MetaTags from '../docs/MetaTags'
import Nugget from '../docs/Nugget'
import StickyNugget from '../docs/StickyNugget'
import type { NextPage } from 'next'
import type { GetStaticProps } from './_app'

export { getStaticProps } from './_app'

const IndexPage: NextPage<GetStaticProps> = ({
  name,
  version,
  description,
  homepage,
  meta,
  reactSpringVersion,
  reactUseGestureVersion,
}) => (
  <>
    <MetaTags
      {...meta}
      name={name}
      description={description}
      homepage={homepage}
    />
    <main>
      <Hero />
      <div className="max-w-5xl mx-auto py-20 px-8 grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-10">
        <Nugget
          heading="Modern"
          lead="Built on top of react-spring and react-use-gesture, following best practices for minimal rerenders and only animating CSS properties that can be done on the GPU when possible."
        />
        <Nugget
          heading="Flexible"
          lead="Can be used like a blocking dialog that require the user to make a choice before it can be closed, or like floating bottom panel. It automatically adapts to the dimensions of the content you put in it."
        />
        <Nugget
          heading="CSS Variables"
          lead="By using CSS Custom Properties you're not limited by what is spring animated by default. You can change which elements animations are applied to without writing any JS."
        />
      </div>
      <div className="max-w-5xl mx-auto pt-20 px-8 grid grid-flow-row">
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
          bg="bg-gray-200"
          heading={scrollable}
          lead={[
            "The snap points api lets you control exactly what positions the sheet can be in. If the user drag the sheet out of bounds you'll get a rubber band effect, and it gently slides into position on release. You can even flick it from top to bottom with some speed, if that's your jam.",
            'By default the sheet will try to use enough height to avoid a scrolling overflow.',
            "And finally, it shows how the sheet behaves when you don't provide the onDismiss callback, note how you can't close it.",
          ]}
          example="/fixtures/scrollable"
        />
        <StickyNugget
          bg="bg-gray-300"
          heading={sticky}
          lead={[
            "Can be really tricky to implement in a performant way. Luckily with this component you don't have to worry about that.",
            'By adding a header the touch hit target is much larger, making it more pleasant to use.',
            "For those big thicc phones they'll be happy to find that you can swipe on the sticky footer to adust the height, making one-handed usage a bit easier.",
            'On top of all that see how it remembers the last snap position it had when closing, and restore it when reopened.',
            'One more thing, the opening transition is interruptible, you can start dragging it right away.',
          ]}
          example="/fixtures/sticky"
        />
        <StickyNugget
          flip
          bg="bg-gray-400"
          text="text-900"
          heading={aside}
          lead={[
            "Examples so far have all been with blocking=true, which is the default state. It's comparable to a blocking modal dialog, you can't interract with the rest of the page until the dialog closes.",
            "This mode can be turned off and changes the look and feel of the sheet to fit scenarios where it's used as you would a draggable sidebar.",
            'Or as an search overlay over a map perhaps. ',
          ]}
          example="/fixtures/aside"
        />
      </div>
    </main>
    <Footer
      version={version}
      reactSpringVersion={reactSpringVersion}
      reactUseGestureVersion={reactUseGestureVersion}
    />
  </>
)

export default IndexPage
