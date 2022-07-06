import type { NextPage } from 'next'
import { useEffect, useState } from 'react'

import Button from '../../docs/fixtures/Button'
import Container from '../../docs/fixtures/Container'
import Expandable from '../../docs/fixtures/Expandable'
import SheetContent from '../../docs/fixtures/SheetContent'
import { sticky } from '../../docs/headings'
import MetaTags from '../../docs/MetaTags'
import { BottomSheet } from '../../src'
import type { GetStaticProps } from '../_app'

export { getStaticProps } from '../_app'

const StickyFixturePage: NextPage<GetStaticProps> = ({
  description,
  homepage,
  meta,
  name,
}) => {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(true)
  }, [])

  function onDismiss() {
    setOpen(false)
  }

  return (
    <>
      <MetaTags
        {...meta}
        name={name}
        description={description}
        homepage={homepage}
        title={sticky}
      />
      <Container>
        <Button onClick={() => setOpen(true)}>Open</Button>
        <BottomSheet
          unstable__debug={process.env.NODE_ENV !== 'production'}
          open={open}
          onDismiss={onDismiss}
          initialHeight={({ lastHeight, snapPoints }) =>
            lastHeight ?? snapPoints[0]
          }
          snapPoints={({ maxHeight, maxContent }) => [
            maxHeight - maxHeight / 5,
            maxContent,
          ]}
          header={
            <h1 className="flex items-center justify-center text-xl font-bold text-gray-800">
              Sticky!
            </h1>
          }
          footer={
            <Button onClick={onDismiss} className="w-full">
              Done
            </Button>
          }
        >
          <SheetContent>
            <p>
              Just as with content, if the header or footer changes their height
              the sheet will readjust accordingly.
            </p>
            <Expandable>
              <div className="block w-full h-10 my-10 bg-gray-200 rounded-md" />
              <p>
                Putting the "Done" button in a sticky footer is a nice touch on
                long bottom sheets with a lot of content. And on resize events
                the sticky elements are always visible, unlike the "Dismiss"
                button in the first example that needs to be animated first.
              </p>
              <div className="block w-full h-10 my-10 bg-gray-200 rounded-md" />
            </Expandable>
            <p>
              When you provide a header the draggable area increases, making it
              easier for users to adjust the height of the bottom sheet.
            </p>
            <p>
              The same is true for a sticky footer, as it supports drag gestures
              as well to optimize for large phones where the header might be
              difficult to reach with one hand.
            </p>
            <Expandable>
              <div className="block w-full h-10 my-10 bg-gray-200 rounded-md" />
              <p>
                Additionally this bottom sheet uses stable viewpoints that are
                equivalent to vh CSS units. Predictable heights like this is
                also handy if there's content loaded async, or you're
                implementing a virtual list so the sheet can't rely on measuring
                the height of its content.
              </p>
              <div className="block w-full h-10 my-10 bg-gray-200 rounded-md" />
            </Expandable>
          </SheetContent>
        </BottomSheet>
      </Container>
    </>
  )
}

export default StickyFixturePage
