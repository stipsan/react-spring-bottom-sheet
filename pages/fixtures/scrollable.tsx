import cx from 'classnames'
import Code from '../../docs/fixtures/Code'
import Container from '../../docs/fixtures/Container'
import ScrollUp from '../../docs/fixtures/ScrollUp'
import SheetContent from '../../docs/fixtures/SheetContent'
import SnapMarker from '../../docs/fixtures/SnapMarker'
import { BottomSheet, ForwardedRefType } from '../../src'
import scrollIntoView from 'smooth-scroll-into-view-if-needed'
import { useRef } from 'react'
import Button from '../../docs/fixtures/Button'

const rand = (_) => _[~~(Math.random() * _.length)]
const colors = [
  'bg-gray-50',
  'bg-gray-100',
  'bg-gray-200',
  'bg-gray-300',
  'bg-gray-400',
  'bg-gray-500',
  'bg-gray-600',
  'bg-gray-700',
  'bg-gray-800',
  'bg-gray-900',
]
const widths = [
  'w-1/2',
  'w-2/5',
  'w-3/5',
  'w-1/3',
  'w-2/3',
  'w-1/4',
  'w-3/4',
  'w-1/5',
  'w-4/5',
  'w-1/6',
  'w-5/6',
  'w-full',
]
const rows = Array.from(Array(20), (_, x) => ({
  key: x,
  bg: rand(colors),
  w: rand(widths),
}))

export default function ScrollableFixturePage() {
  const focusRef = useRef<HTMLButtonElement>()
  const sheetRef = useRef<ForwardedRefType>()

  return (
    <Container>
      <SnapMarker
        className="text-white text-opacity-50"
        style={{ top: '10vh' }}
      />
      <SnapMarker style={{ top: '10vh', ['--size' as any]: '0.5vh' }} />
      <SnapMarker
        className="text-white text-opacity-50"
        style={{ top: '40vh' }}
      />
      <SnapMarker style={{ top: '40vh', ['--size' as any]: '0.5vh' }} />
      <SnapMarker
        className="text-white text-opacity-50"
        style={{ top: '75vh' }}
      />
      <SnapMarker style={{ top: '75vh', ['--size' as any]: '0.5vh' }} />
      <BottomSheet
        isOpen
        ref={sheetRef}
        initialFocusRef={focusRef}
        initialHeight={({ snapPoints: [, _] }) => _}
        snapPoints={({ viewportHeight }) => [
          viewportHeight - viewportHeight / 10,
          viewportHeight / 4,
          viewportHeight * 0.6,
        ]}
      >
        <SheetContent>
          <div className="grid grid-cols-3 w-full gap-4">
            <Button
              textSize="text-sm"
              padding="px2 py-1"
              onClick={() =>
                sheetRef.current.setHeight(
                  // the snapPoints are always asc sorted, thus it's safe to pick by index
                  ({ snapPoints: [, , snapPoint] }) => snapPoint
                )
              }
            >
              Top
            </Button>
            <Button
              ref={focusRef}
              textSize="text-sm"
              padding="px2 py-1"
              onClick={() =>
                sheetRef.current.setHeight(
                  ({ snapPoints: [, snapPoint] }) => snapPoint
                )
              }
            >
              Middle
            </Button>
            <Button
              textSize="text-sm"
              padding="px2 py-1"
              onClick={() =>
                sheetRef.current.setHeight(
                  ({ snapPoints: [snapPoint] }) => snapPoint
                )
              }
            >
              Bottom
            </Button>
          </div>
          <p>
            The sheet will always try to set initial focus on the first
            interactive element it finds.
          </p>
          <p>If none is found it sets keyboard focus to the container.</p>
          <p>
            You can override this with <Code>initialFocusRef</Code>.
          </p>
          {rows.map(({ key, bg, w }) => (
            <div
              key={`row-${key}`}
              className={cx('block rounded-md h-8', bg, w)}
            />
          ))}
          <ScrollUp
            className="my-6"
            onClick={async () => {
              await scrollIntoView(focusRef.current, { block: 'end' })
              focusRef.current.focus()
            }}
          />
        </SheetContent>
      </BottomSheet>
    </Container>
  )
}
