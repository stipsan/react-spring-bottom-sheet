import { useEffect, useRef, useState } from 'react'
import Button from '../../docs/fixtures/Button'
import Code from '../../docs/fixtures/Code'
import Container from '../../docs/fixtures/Container'
import Kbd from '../../docs/fixtures/Kbd'
import SheetContent from '../../docs/fixtures/SheetContent'
import { BottomSheet } from '../../src'

export default function AsideFixturePage() {
  const [open, setOpen] = useState(true)
  const focusRef = useRef<HTMLButtonElement>()

  useEffect(() => {
    focusRef.current.focus()
  }, [])

  return (
    <Container>
      <Button onClick={() => setOpen((open) => !open)} ref={focusRef}>
        {open ? 'Close' : 'Open'}
      </Button>
      <BottomSheet
        isOpen={open}
        onDismiss={() => setOpen(false)}
        blocking={false}
        snapPoints={({ viewportHeight }) => [
          viewportHeight / 4,
          viewportHeight * 0.6,
        ]}
      >
        <SheetContent>
          <p>
            When <Code>blocking</Code> is <Code>false</Code> it's possible to
            use the Bottom Sheet as an height adjustable sidebar/panel.
          </p>
          <p>
            You can combine this with <Code>onDismissable</Code> to fine-tune
            the behavior you want.
          </p>
          <div className=" h-96" />
        </SheetContent>
      </BottomSheet>
    </Container>
  )
}
