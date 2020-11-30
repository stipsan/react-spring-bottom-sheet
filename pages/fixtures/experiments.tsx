import { useState } from 'react'
import Button from '../../docs/fixtures/Button'
import Code from '../../docs/fixtures/Code'
import Container from '../../docs/fixtures/Container'
import Kbd from '../../docs/fixtures/Kbd'
import SheetContent from '../../docs/fixtures/SheetContent'
import { BottomSheet } from '../../src'

export default function ExperimentsFixturePage() {
  const [open, setOpen] = useState(true)

  function onDismiss() {
    setOpen(false)
  }

  return (
    <>
      <Container>
        <Button onClick={() => setOpen(true)}>Open</Button>
        <BottomSheet
          style={{ ['--rsbs-bg' as any]: '#EFF6FF' }}
          open={open}
          header={false}
          onDismiss={onDismiss}
          //snapPoints={({ maxHeight }) => [maxHeight]}
          snapPoints={(args) => [100]}
        >
          <SheetContent>
            <p>
              Using <Code>onDismiss</Code> lets users close the sheet by swiping
              it down, tapping on the backdrop or by hitting <Kbd>esc</Kbd> on
              their keyboard.
            </p>
            <Button
              onClick={onDismiss}
              className="w-full focus:ring-offset-rsbs-bg"
            >
              Dismiss
            </Button>
          </SheetContent>
        </BottomSheet>
      </Container>
    </>
  )
}
