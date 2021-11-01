import type { NextPage } from 'next'
import { useEffect, useState } from 'react'
import { config } from '@react-spring/web'
import * as d3 from 'd3-ease'
import Button from '../../docs/fixtures/Button.client'
import Code from '../../docs/fixtures/Code'
import Container from '../../docs/fixtures/Container'
import Expandable from '../../docs/fixtures/Expandable'
import Kbd from '../../docs/fixtures/Kbd'
import SheetContent from '../../docs/fixtures/SheetContent'
import { simple } from '../../docs/headings'
import MetaTags from '../../docs/MetaTags'
import { BottomSheet } from '../../docs/BottomSheet.client'
import type { GetStaticProps } from '../_app'

// export { getStaticProps } from '../_app'

const SimpleFixturePage: NextPage<GetStaticProps> = ({}) => {
  const [open, setOpen] = useState(false)
  const [maxHeight, setMaxHeight] = useState(0)
  const [label, setLabel] = useState('Open')

  useEffect(() => {
    // @ts-expect-error
    window.setMaxHeight = (maxHeight) => setMaxHeight(maxHeight)
    // @ts-expect-error
    window.setLabel = (label) => setLabel(label)
  }, [])

  // Ensure it animates in when loaded
  useEffect(() => {
    setOpen(true)
  }, [])

  function onDismiss() {
    setOpen(false)
  }

  return (
    <>
      <div style={{ height: '100vh' }} />
      <Container>
        <Button onClick={() => setOpen(true)}>{label}</Button>
        <BottomSheet
          open={open}
          maxHeight={maxHeight}
          onDismiss={onDismiss}
          snapPoints={({ maxContent, maxHeight }) => [
            maxContent,
            //maxContent + (maxHeight - maxContent) / 2,
            //maxHeight,
          ]}
        >
          <SheetContent>
            <input type="text" autoFocus />
            <p>
              Using <Code>onDismiss</Code> lets users close the sheet by swiping
              it down, tapping on the backdrop or by hitting <Kbd>esc</Kbd> on
              their keyboard.
            </p>
            <Expandable>
              <div className="bg-gray-200 block rounded-md h-10 w-full my-10" />
              <p>
                The height adjustment is done automatically, it just works™!
              </p>
              <div className="bg-gray-200 block rounded-md h-10 w-full my-10" />
            </Expandable>
            <Button onClick={onDismiss} className="w-full">
              Dismiss
            </Button>
          </SheetContent>
        </BottomSheet>
      </Container>
      <div style={{ height: '100vh' }} />
    </>
  )
}

export default SimpleFixturePage
