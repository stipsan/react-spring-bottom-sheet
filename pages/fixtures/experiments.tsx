import { useCallback, useMemo, useState } from 'react'
import Button from '../../docs/fixtures/Button'
import Code from '../../docs/fixtures/Code'
import Container from '../../docs/fixtures/Container'
import Kbd from '../../docs/fixtures/Kbd'
import SheetContent from '../../docs/fixtures/SheetContent'
import { BottomSheet } from '../../src'
import { useInterval } from '../../src/hooks'

function One() {
  const [open, setOpen] = useState(false)

  const [seconds, setSeconds] = useState(1)

  const style = useMemo(() => ({ ['--rsbs-bg' as any]: '#EFF6FF' }), [])
  const onDismiss = useCallback(() => setOpen(false), [])
  const children = useMemo(
    () => (
      <SheetContent>
        <p>
          Using <Code>onDismiss</Code> lets users close the sheet by swiping it
          down, tapping on the backdrop or by hitting <Kbd>esc</Kbd> on their
          keyboard.
        </p>
        <Button
          onClick={onDismiss}
          className="w-full focus-visible:ring-offset-rsbs-bg"
        >
          Dismiss
        </Button>
      </SheetContent>
    ),
    [onDismiss]
  )

  useInterval(() => {
    if (open) {
      setSeconds(seconds + 1)
    }
  }, 10000)

  return (
    <>
      <Button onClick={() => setOpen(true)}>{seconds}</Button>
      <BottomSheet
        style={style}
        open={open}
        header={false}
        onDismiss={onDismiss}
      >
        {children}
      </BottomSheet>
    </>
  )
}

function Two() {
  const [open, setOpen] = useState(false)

  function onDismiss() {
    setOpen(false)
  }
  return (
    <>
      <Button onClick={() => setOpen(true)}>2</Button>
      <BottomSheet
        style={{ ['--rsbs-bg' as any]: '#EFF6FF' }}
        open={open}
        header={false}
        onDismiss={onDismiss}
        footer={
          <Button
            onClick={onDismiss}
            className="w-full focus-visible:ring-offset-rsbs-bg"
          >
            Dismiss
          </Button>
        }
        initialSnapPoint={({ footerHeight }) => footerHeight}
        snapPoints={({ minHeight: maxHeight, footerHeight }) => [
          footerHeight,
          maxHeight,
        ]}
      >
        <SheetContent>
          <p>
            Using <Code>onDismiss</Code> lets users close the sheet by swiping
            it down, tapping on the backdrop or by hitting <Kbd>esc</Kbd> on
            their keyboard.
          </p>
        </SheetContent>
      </BottomSheet>
    </>
  )
}

function Three() {
  const [open, setOpen] = useState(false)

  function onDismiss() {
    setOpen(false)
  }
  return (
    <>
      <Button onClick={() => setOpen(true)}>3</Button>
      <BottomSheet
        style={{ ['--rsbs-bg' as any]: '#EFF6FF' }}
        open={open}
        onDismiss={onDismiss}
        header={
          <Button
            onClick={onDismiss}
            className="w-full focus-visible:ring-offset-rsbs-bg"
          >
            Dismiss
          </Button>
        }
        snapPoints={({ minHeight: maxHeight, headerHeight }) => [
          headerHeight,
          maxHeight,
        ]}
      >
        <SheetContent>
          <p>
            Using <Code>onDismiss</Code> lets users close the sheet by swiping
            it down, tapping on the backdrop or by hitting <Kbd>esc</Kbd> on
            their keyboard.
          </p>
        </SheetContent>
      </BottomSheet>
    </>
  )
}

function Four() {
  const [open, setOpen] = useState(false)

  function onDismiss() {
    setOpen(false)
  }
  return (
    <>
      <Button onClick={() => setOpen(true)}>4</Button>
      <BottomSheet
        style={{ ['--rsbs-bg' as any]: '#EFF6FF' }}
        open={open}
        onDismiss={onDismiss}
        snapPoints={({ minHeight: maxHeight }) => [0, maxHeight]}
      >
        <SheetContent>
          <p>
            Using <Code>onDismiss</Code> lets users close the sheet by swiping
            it down, tapping on the backdrop or by hitting <Kbd>esc</Kbd> on
            their keyboard.
          </p>
        </SheetContent>
      </BottomSheet>
    </>
  )
}

function Five() {
  const [open, setOpen] = useState(false)

  function onDismiss() {
    setOpen(false)
  }
  return (
    <>
      <Button onClick={() => setOpen(true)}>5</Button>
      <BottomSheet
        style={{ ['--rsbs-bg' as any]: '#EFF6FF' }}
        open={open}
        footer={<strong>Sticky footer</strong>}
        onDismiss={onDismiss}
        initialSnapPoint={({ lastSnap }) => lastSnap}
        snapPoints={({ minHeight: maxHeight, headerHeight, footerHeight }) => [
          headerHeight,
          headerHeight + footerHeight,
          maxHeight,
        ]}
      >
        <SheetContent>
          <p>
            Using <Code>onDismiss</Code> lets users close the sheet by swiping
            it down, tapping on the backdrop or by hitting <Kbd>esc</Kbd> on
            their keyboard.
          </p>
        </SheetContent>
      </BottomSheet>
    </>
  )
}

export default function ExperimentsFixturePage() {
  return (
    <>
      <Container>
        <One />
        <Two />
        <Three />
        <Four />
        <Five />
      </Container>
    </>
  )
}
