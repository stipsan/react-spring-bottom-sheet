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
        header={<div>Cancel Testing!</div>}
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
        </SheetContent>
      </BottomSheet>
    </Container>
  )
}
