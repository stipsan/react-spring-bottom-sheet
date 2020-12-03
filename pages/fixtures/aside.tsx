import { useEffect, useRef, useState } from 'react'
import Button from '../../docs/fixtures/Button'
import Code from '../../docs/fixtures/Code'
import Container from '../../docs/fixtures/Container'
import SheetContent from '../../docs/fixtures/SheetContent'
import { aside } from '../../docs/headings'
import HeadTitle from '../../docs/HeadTitle'
import { BottomSheet } from '../../src'

export default function AsideFixturePage() {
  const [open, setOpen] = useState(true)
  const focusRef = useRef<HTMLButtonElement>()

  useEffect(() => {
    // Setting focus is to aid keyboard and screen reader nav when activating this iframe
    focusRef.current.focus()
  }, [])

  return (
    <>
      <HeadTitle>{aside}</HeadTitle>
      <Container>
        <Button onClick={() => setOpen((open) => !open)} ref={focusRef}>
          {open ? 'Close' : 'Open'}
        </Button>
        <BottomSheet
          open={open}
          onDismiss={() => setOpen(false)}
          blocking={false}
          snapPoints={({ maxHeight }) => [maxHeight / 4, maxHeight * 0.6]}
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
          </SheetContent>
        </BottomSheet>
      </Container>
    </>
  )
}
