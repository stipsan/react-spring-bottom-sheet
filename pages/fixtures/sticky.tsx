import type { NextPage } from 'next'
import { useEffect, useState } from 'react'
import Button from '../../docs/fixtures/Button'
import Container from '../../docs/fixtures/Container'
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
          open={open}
          onDismiss={onDismiss}
          defaultSnap={({ snapPoints, lastSnap }) =>
            lastSnap ?? Math.max(...snapPoints)
          }
          snapPoints={({ maxHeight }) => [
            maxHeight - maxHeight / 10,
            maxHeight * 0.6,
          ]}
          header={
            <h1 className="flex items-center text-xl justify-center font-bold text-gray-800">
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
            <p>
              When you provide a header the draggable area increases, making it
              easier for users to adjust the height of the bottom sheet.
            </p>
            <p>
              The same is true for a sticky footer, as it supports drag gestures
              as well to optimize for large phones where the header might be
              difficult to reach with one hand.
            </p>
          </SheetContent>
        </BottomSheet>
      </Container>
    </>
  )
}

export default StickyFixturePage
