import { useEffect, useState } from 'react'
import Button from '../../docs/fixtures/Button'
import Container from '../../docs/fixtures/Container'
import SheetContent from '../../docs/fixtures/SheetContent'
import Code from '../../docs/fixtures/Code'
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
            This example only configures <Code>isOpen</Code>,
            <Code>onDismiss</Code>, and sets <Code>snapPoints</Code> to{' '}
            <Code>maxHeight</Code>
          </p>
          <Button onClick={onDismiss} className="w-full">
            Dismiss
          </Button>
        </SheetContent>
      </BottomSheet>
    </Container>
  )
}
