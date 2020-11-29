import { useEffect, useState } from 'react'
import Button from '../../docs/fixtures/Button'
import Container from '../../docs/fixtures/Container'
import SheetContent from '../../docs/fixtures/SheetContent'
import { BottomSheet } from '../../src'

export default function SimpleFixturePage() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(true)
  }, [])

  return (
    <Container>
      <Button onClick={() => setOpen(true)}>Open</Button>
      <BottomSheet
        isOpen={open}
        onDismiss={() => setOpen(false)}
        snapPoints={({ maxHeight }) => [maxHeight]}
      >
        <SheetContent>
          <p>Yay!</p>
          Test
          <Button className="w-full">Dismiss</Button>
        </SheetContent>
      </BottomSheet>
    </Container>
  )
}
