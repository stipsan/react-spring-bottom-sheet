import { useEffect, useState } from 'react'
import Button from '../../docs/fixtures/Button'
import Container from '../../docs/fixtures/Container'
import SheetContent from '../../docs/fixtures/SheetContent'
import Code from '../../docs/fixtures/Code'
import Kbd from '../../docs/fixtures/Kbd'
import { BottomSheet } from '../../src'

export default function SimpleFixturePage() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(true)
  }, [])

  function onDismiss() {
    setOpen(false)
  }

  return (
    <Container>
      <Button onClick={() => setOpen(true)}>Open</Button>
      <BottomSheet
        isOpen={open}
        onDismiss={onDismiss}
        snapPoints={({ maxHeight }) => [maxHeight]}
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
  )
}
