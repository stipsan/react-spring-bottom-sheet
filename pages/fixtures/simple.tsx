import { useState } from 'react'
import Button from '../../docs/fixtures/Button'
import Code from '../../docs/fixtures/Code'
import Container from '../../docs/fixtures/Container'
import Kbd from '../../docs/fixtures/Kbd'
import SheetContent from '../../docs/fixtures/SheetContent'
import { simple } from '../../docs/headings'
import HeadTitle from '../../docs/HeadTitle'
import { BottomSheet } from '../../src'

export default function SimpleFixturePage() {
  const [open, setOpen] = useState(true)

  function onDismiss() {
    setOpen(false)
  }

  return (
    <>
      <HeadTitle>{simple}</HeadTitle>
      <Container>
        <Button onClick={() => setOpen(true)}>Open</Button>
        <BottomSheet
          open={open}
          onDismiss={onDismiss}
          snapPoints={({ minHeight: maxHeight }) => maxHeight}
        >
          <SheetContent>
            <p>
              Using <Code>onDismiss</Code> lets users close the sheet by swiping
              it down, tapping on the backdrop or by hitting <Kbd>esc</Kbd> on
              their keyboard.
            </p>
            <Button onClick={onDismiss} className="w-full">
              Dismiss
            </Button>
          </SheetContent>
        </BottomSheet>
      </Container>
    </>
  )
}
