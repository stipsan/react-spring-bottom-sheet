import { useEffect, useState } from 'react'
import Button from '../../docs/fixtures/Button'
import Container from '../../docs/fixtures/Container'
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
        <div className="pb-20 px-4 pt-4">Yay!</div>
      </BottomSheet>
    </Container>
  )
}
