import Hero from '../docs/Hero'
import StickyNugget from '../docs/StickyNugget'

export default function IndexPage() {
  return (
    <>
      <Hero />
      <StickyNugget heading="Heading" lead="Intro" example="/fixtures/simple" />
    </>
  )
}
