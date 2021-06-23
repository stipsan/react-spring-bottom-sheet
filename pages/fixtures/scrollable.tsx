import cx from 'classnames'
import type { NextPage } from 'next'
import { useRef, useState } from 'react'
import scrollIntoView from 'smooth-scroll-into-view-if-needed'
import Button from '../../docs/fixtures/Button'
import CloseExample from '../../docs/fixtures/CloseExample'
import Code from '../../docs/fixtures/Code'
import Container from '../../docs/fixtures/Container'
import ScrollUp from '../../docs/fixtures/ScrollUp'
import SheetContent from '../../docs/fixtures/SheetContent'
import SnapMarker from '../../docs/fixtures/SnapMarker'
import { scrollable } from '../../docs/headings'
import MetaTags from '../../docs/MetaTags'
import { BottomSheet, BottomSheetRef } from '../../src'
import type { GetStaticProps } from '../_app'

export { getStaticProps } from '../_app'

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

const ScrollableFixturePage: NextPage<GetStaticProps> = ({
  description,
  homepage,
  meta,
  name,
}) => {
  const [expandOnContentDrag, setExpandOnContentDrag] = useState(true)
  const focusRef = useRef<HTMLButtonElement>()
  const sheetRef = useRef<BottomSheetRef>()

  return (
    <>
      <MetaTags
        {...meta}
        name={name}
        description={description}
        homepage={homepage}
        title={scrollable}
      />
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
          open
          skipInitialTransition
          sibling={<CloseExample className="z-10" />}
          ref={sheetRef}
          initialFocusRef={focusRef}
          defaultSnap={({ maxHeight }) => maxHeight / 2}
          snapPoints={({ maxHeight }) => [
            maxHeight - maxHeight / 10,
            maxHeight / 4,
            maxHeight * 0.6,
          ]}
          expandOnContentDrag={expandOnContentDrag}
        >
          <SheetContent>
            <div className="grid grid-cols-3 w-full gap-4">
              <Button
                className={[
                  ' text-sm px2 py-1',
                  { 'text-xl': false, 'px-7': false, 'py-3': false },
                ]}
                onClick={() =>
                  sheetRef.current.snapTo(({ snapPoints }) =>
                    Math.max(...snapPoints)
                  )
                }
              >
                Top
              </Button>
              <Button
                ref={focusRef}
                className={[
                  ' text-sm px2 py-1',
                  { 'text-xl': false, 'px-7': false, 'py-3': false },
                ]}
                onClick={() =>
                  sheetRef.current.snapTo(({ maxHeight }) => maxHeight / 2)
                }
              >
                Middle
              </Button>
              <Button
                className={[
                  ' text-sm px2 py-1',
                  { 'text-xl': false, 'px-7': false, 'py-3': false },
                ]}
                onClick={() =>
                  sheetRef.current.snapTo(({ snapPoints }) =>
                    Math.min(...snapPoints)
                  )
                }
              >
                Bottom
              </Button>
            </div>
            <div className="grid w-full">
              <Button
                  className={[
                    ' text-sm px-2 py-1',
                    { 'text-xl': false, 'px-7': false, 'py-3': false },
                  ]}
                  onClick={() => setExpandOnContentDrag(!expandOnContentDrag)}
                >
                {expandOnContentDrag ? 'Disable' : 'Enable'} expand on content drag
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
    </>
  )
}

export default ScrollableFixturePage
