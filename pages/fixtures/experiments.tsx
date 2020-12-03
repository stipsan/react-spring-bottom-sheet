import useInterval from '@use-it/interval'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import Button from '../../docs/fixtures/Button'
import Code from '../../docs/fixtures/Code'
import Container from '../../docs/fixtures/Container'
import Kbd from '../../docs/fixtures/Kbd'
import SheetContent from '../../docs/fixtures/SheetContent'
import { BottomSheet } from '../../src'

// Just to test we can stop re-renders with this pattern when necessary
const MemoBottomSheet = memo(BottomSheet)

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
  }, 100)

  return (
    <>
      <Button onClick={() => setOpen(true)}>{seconds}</Button>
      <MemoBottomSheet
        style={style}
        open={open}
        header={false}
        onDismiss={onDismiss}
      >
        {children}
      </MemoBottomSheet>
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
        defaultSnap={({ footerHeight }) => footerHeight}
        snapPoints={({ minHeight, footerHeight }) => [footerHeight, minHeight]}
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
        snapPoints={({ minHeight, headerHeight }) => [headerHeight, minHeight]}
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
        snapPoints={({ minHeight }) => [0, minHeight]}
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
        defaultSnap={({ lastSnap }) => lastSnap}
        snapPoints={({ minHeight, headerHeight, footerHeight }) => [
          headerHeight,
          headerHeight + footerHeight,
          minHeight,
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

function Six() {
  const [open, setOpen] = useState(false)
  const [half, setHalf] = useState(false)
  const [maxHeight, setMaxHeight] = useState(() =>
    typeof window !== 'undefined'
      ? half
        ? window.innerHeight / 2
        : window.innerHeight
      : 0
  )

  useEffect(() => {
    setMaxHeight(half ? window.innerHeight / 2 : window.innerHeight)
  }, [half])

  return (
    <>
      <Button onClick={() => setOpen(true)}>6</Button>
      <BottomSheet
        style={{ ['--rsbs-bg' as any]: '#EFF6FF' }}
        open={open}
        maxHeight={maxHeight}
        onDismiss={() => setOpen(false)}
        snapPoints={({ minHeight, maxHeight }) => [minHeight, maxHeight]}
      >
        <SheetContent>
          <Button onClick={() => setHalf((half) => !half)}>
            {half ? 'maxHeight 100%' : 'maxHeight 50%'}
          </Button>
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
        <Six />
      </Container>
    </>
  )
}
