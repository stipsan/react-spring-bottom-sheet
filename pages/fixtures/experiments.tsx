import useRaf from '@rooks/use-raf'
import useInterval from '@use-it/interval'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Button from '../../docs/fixtures/Button'
import Code from '../../docs/fixtures/Code'
import Container from '../../docs/fixtures/Container'
import Expandable from '../../docs/fixtures/Expandable'
import Kbd from '../../docs/fixtures/Kbd'
import SheetContent from '../../docs/fixtures/SheetContent'
import { BottomSheet, BottomSheetRef } from '../../src'

// Just to test we can stop re-renders with this pattern when necessary
const MemoBottomSheet = memo(BottomSheet)

function One() {
  const [open, setOpen] = useState(false)

  const [renders, setRenders] = useState(1)

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

  useRaf(() => {
    setRenders(renders + 1)
  }, open)

  useEffect(() => {
    if (open) {
      return () => {
        setRenders(1)
      }
    }
  }, [open])

  return (
    <>
      <Button onClick={() => setOpen(true)}>{renders}</Button>
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
  const [header, setHeader] = useState(false)

  function onDismiss() {
    setOpen(false)
  }
  return (
    <>
      <Button onClick={() => setOpen(true)}>2</Button>
      <BottomSheet
        style={{ ['--rsbs-bg' as any]: '#EFF6FF' }}
        open={open}
        header={header}
        onDismiss={onDismiss}
        footer={
          <Button
            onClick={onDismiss}
            className="w-full focus-visible:ring-offset-rsbs-bg"
          >
            Dismiss
          </Button>
        }
        defaultSnap={({ headerHeight, footerHeight, minHeight }) =>
          //headerHeight + footerHeight
          minHeight
        }
        snapPoints={({ minHeight, headerHeight, footerHeight }) => [
          headerHeight + footerHeight,
          minHeight,
        ]}
      >
        <SheetContent>
          <Button
            onClick={() => setHeader((header) => !header)}
            className="w-full focus-visible:ring-offset-rsbs-bg"
          >
            header: {header ? 'true' : 'false'}
          </Button>
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
        open={open}
        onDismiss={onDismiss}
        header={
          <input
            className="mt-1 block w-full rounded-md bg-gray-100 border-transparent focus:border-gray-300 focus:bg-white focus:ring-0"
            type="text"
            placeholder="Text input field in a sticky header"
          />
        }
        footer={
          <input
            className="mt-1 block w-full rounded-md bg-gray-100 border-transparent focus:border-gray-300 focus:bg-white focus:ring-0"
            type="text"
            placeholder="Text input field in a sticky header"
          />
        }
      >
        <SheetContent>
          <input
            className="mt-1 block w-full rounded-md bg-gray-100 border-transparent focus:border-gray-300 focus:bg-white focus:ring-0"
            type="text"
            placeholder="Text input field in a sticky header"
          />
          <Expandable>
            <div className="bg-gray-200 block rounded-md h-10 w-full my-10" />
            <p>Testing focus management and keyboard behavior on open.</p>
            <div className="bg-gray-200 block rounded-md h-10 w-full my-10" />
          </Expandable>
          <input
            className="mt-1 block w-full rounded-md bg-gray-100 border-transparent focus:border-gray-300 focus:bg-white focus:ring-0"
            type="text"
            placeholder="Text input field in a sticky header"
          />
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

  const style = { ['--rsbs-bg' as any]: '#EFF6FF' }
  if (half) {
    // setting it to undefined removes it, so we don't have to hardcode the default rounding we want in this component
    style['--rsbs-overlay-rounded' as any] = undefined
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>6</Button>
      <BottomSheet
        style={style}
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

function Seven() {
  const [open, setOpen] = useState(false)
  const [shift, setShift] = useState(false)

  useInterval(() => {
    if (open) {
      setShift((shift) => !shift)
    }
  }, 1000)

  return (
    <>
      <Button onClick={() => setOpen(true)}>7</Button>
      <BottomSheet
        open={open}
        maxHeight={
          typeof window !== 'undefined'
            ? shift
              ? window.innerHeight / 2
              : window.innerHeight
            : 0
        }
        onDismiss={() => setOpen(false)}
        snapPoints={({ maxHeight }) => [maxHeight]}
      >
        <SheetContent>maxHeight {shift ? 'shifted' : 'normal'}</SheetContent>
      </BottomSheet>
    </>
  )
}

function Eight() {
  const [open, setOpen] = useState(false)
  const [defaultSnap, setDefaultSnap] = useState(200)
  const reopenRef = useRef(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>8</Button>
      <BottomSheet
        open={open}
        onDismiss={() => setOpen(false)}
        defaultSnap={defaultSnap}
        snapPoints={({ minHeight, maxHeight }) => [minHeight, maxHeight]}
        onSpringEnd={(event) => {
          if (reopenRef.current && event.type === 'CLOSE') {
            reopenRef.current = false
            setOpen(true)
          }
        }}
        // @TODO investigate missing opacity fade out on close if onDismiss isn't used
        /*
        footer={
          <Button
            
            className="w-full focus-visible:ring-offset-rsbs-bg"
          >
            Dismiss
          </Button>
        }
        //*/
      >
        <SheetContent>
          <Button
            onClick={() => {
              reopenRef.current = true
              setDefaultSnap((defaultSnap) => (defaultSnap === 200 ? 800 : 200))
              setOpen(false)
            }}
          >
            defaultSnap: {defaultSnap}
          </Button>
        </SheetContent>
      </BottomSheet>
    </>
  )
}

function Nine() {
  const [open, setOpen] = useState(false)
  const [expandHeader, setExpandHeader] = useState(false)
  const [expandContent, setExpandContent] = useState(false)
  const [expandFooter, setExpandFooter] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>9</Button>
      <BottomSheet
        open={open}
        onDismiss={() => setOpen(false)}
        header={
          <div>
            <Button onClick={() => setExpandHeader(true)}>Expand</Button>
            <br />
            {expandHeader && (
              <Button onClick={() => setExpandHeader(false)}>No!</Button>
            )}
          </div>
        }
        footer={
          <>
            <Button onClick={() => setExpandFooter(true)}>Expand</Button>
            <br />
            {expandFooter && (
              <Button onClick={() => setExpandFooter(false)}>No!</Button>
            )}
          </>
        }
      >
        <SheetContent>
          <Button onClick={() => setExpandContent(true)}>Expand</Button>
          {expandContent && (
            <Button onClick={() => setExpandContent(false)}>No!</Button>
          )}
        </SheetContent>
      </BottomSheet>
    </>
  )
}

function Ten() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>10</Button>
      <BottomSheet
        open={open}
        onDismiss={() => setOpen(false)}
        defaultSnap={({ snapPoints }) => Math.max(...snapPoints)}
        snapPoints={({ minHeight, maxHeight }) =>
          [maxHeight, maxHeight * 0.7, maxHeight * 0.3].map((v) =>
            Math.min(v, minHeight)
          )
        }
      >
        <SheetContent>
          <Expandable>
            <div className="bg-gray-200 block rounded-md h-screen w-full my-10" />
          </Expandable>
        </SheetContent>
      </BottomSheet>
    </>
  )
}

function Eleven() {
  const [open, setOpen] = useState(false)
  const [height, setHeight] = useState(undefined)
  const sheetRef = useRef<BottomSheetRef>()

  return (
    <>
      <Button onClick={() => setOpen(true)}>11</Button>
      <BottomSheet
        ref={sheetRef}
        open={open}
        onDismiss={() => setOpen(false)}
        snapPoints={({ minHeight, maxHeight }) => [
          height ? minHeight : maxHeight,
          200,
        ]}
        onSpringStart={(event) => {
          if (event.type === 'SNAP' && event.source === 'custom') {
            setTimeout(() => setHeight('80vh'), 100)
          }
        }}
        onSpringEnd={(event) => {
          if (event.type === 'SNAP' && event.source === 'custom') {
            setHeight(undefined)
          }
        }}
        footer={
          <Button
            onClick={() =>
              sheetRef.current.snapTo(
                ({ height, snapPoints }) => {
                  const minSnap = Math.min(...snapPoints)
                  return height > minSnap ? minSnap : Math.max(...snapPoints)
                },
                { velocity: 0, source: 'reset' }
              )
            }
          >
            Reset
          </Button>
        }
      >
        <SheetContent style={{ height }}>
          <Button
            onClick={() =>
              sheetRef.current.snapTo(({ height, snapPoints }) => {
                const minSnap = Math.min(...snapPoints)
                return height > minSnap ? minSnap : Math.max(...snapPoints)
              })
            }
          >
            snapTo
          </Button>
          <div className="bg-gray-200 block rounded-md h-screen w-full my-10" />
        </SheetContent>
      </BottomSheet>
    </>
  )
}

function Twelve() {
  const [open, setOpen] = useState(false)
  const sheetRef = useRef<BottomSheetRef>()
  const [height, setHeight] = useState(0)

  return (
    <>
      <Button onClick={() => setOpen(true)}>12</Button>
      <BottomSheet
        ref={sheetRef}
        open={open}
        onDismiss={() => setOpen(false)}
        defaultSnap={({ snapPoints }) => Math.max(...snapPoints)}
        snapPoints={({ minHeight, maxHeight }) =>
          [maxHeight, maxHeight * 0.7, maxHeight * 0.3].map((v) =>
            Math.min(v, minHeight)
          )
        }
        onSpringStart={(event) => {
          console.log('onSpringStart', event, sheetRef.current.height)
          setHeight(sheetRef.current.height)
          requestAnimationFrame(() => setHeight(sheetRef.current.height))
          if (event.type === 'OPEN') {
            setTimeout(() => setHeight(sheetRef.current.height), 100)
          }
        }}
        onSpringCancel={(event) => {
          console.log('onSpringCancel', event, sheetRef.current.height)
          setHeight(sheetRef.current.height)
        }}
        onSpringEnd={(event) => {
          console.log('onSpringEnd', event, sheetRef.current.height)
          setHeight(sheetRef.current.height)
        }}
        footer={<div className="w-full text-center">Height: {height}</div>}
      >
        <SheetContent>
          <Expandable>
            <div className="bg-gray-200 block rounded-md h-screen w-full my-10" />
          </Expandable>
        </SheetContent>
      </BottomSheet>
    </>
  )
}

export default function ExperimentsFixturePage() {
  return (
    <Container
      className={[
        { 'bg-white': false },
        'bg-gray-200 grid-cols-3 place-items-center',
      ]}
    >
      <One />
      <Two />
      <Three />
      <Four />
      <Five />
      <Six />
      <Seven />
      <Eight />
      <Nine />
      <Ten />
      <Eleven />
      <Twelve />
    </Container>
  )
}
