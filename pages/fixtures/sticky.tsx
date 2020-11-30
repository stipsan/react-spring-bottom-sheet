import { useState } from 'react'
import Button from '../../docs/fixtures/Button'
import Container from '../../docs/fixtures/Container'
import SheetContent from '../../docs/fixtures/SheetContent'
import { BottomSheet } from '../../src'

export default function StickyFixturePage() {
  const [open, setOpen] = useState(true)

  function onDismiss() {
    setOpen(false)
  }

  return (
    <Container>
      <Button onClick={() => setOpen(true)}>Open</Button>
      <BottomSheet
        isOpen={open}
        onDismiss={onDismiss}
        initialHeight={({ snapPoints }) => Math.max(...snapPoints)}
        snapPoints={({ viewportHeight }) => [
          viewportHeight - viewportHeight / 10,
          viewportHeight * 0.6,
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
  )
}
