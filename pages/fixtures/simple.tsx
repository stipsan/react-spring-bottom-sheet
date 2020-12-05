import type { NextPage } from 'next'
import { useEffect, useState } from 'react'
import Button from '../../docs/fixtures/Button'
import Code from '../../docs/fixtures/Code'
import Container from '../../docs/fixtures/Container'
import Kbd from '../../docs/fixtures/Kbd'
import SheetContent from '../../docs/fixtures/SheetContent'
import { simple } from '../../docs/headings'
import MetaTags from '../../docs/MetaTags'
import { BottomSheet } from '../../src'
import type { GetStaticProps } from '../_app'

export { getStaticProps } from '../_app'

const SimpleFixturePage: NextPage<GetStaticProps> = ({
  description,
  homepage,
  meta,
  name,
}) => {
  const [open, setOpen] = useState(false)

  // Ensure it animates in when loaded
  useEffect(() => {
    setOpen(true)
  }, [])

  function onDismiss() {
    setOpen(false)
  }

  return (
    <>
      <MetaTags
        {...meta}
        name={name}
        description={description}
        homepage={homepage}
        title={simple}
      />
      <Container>
        <Button onClick={() => setOpen(true)}>Open</Button>
        <BottomSheet
          open={open}
          onDismiss={onDismiss}
          snapPoints={({ minHeight }) => minHeight}
        >
          <SheetContent>
            <p>
              Using <Code>onDismiss</Code> lets users close the sheet by swiping
              it down, tapping on the backdrop or by hitting <Kbd>esc</Kbd> on
              their keyboard.
            </p>
            <details className=" text-xl px-7 py-3 rounded-2xl transition-colors duration-150 focus-within:duration-0 bg-gray-100 text-gray-900 focus:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-white focus-within:ring-gray-300 w-full">
              <summary className="focus:outline-none">
                Tap on me to expand and change the height
              </summary>
              <div className="bg-gray-200 block rounded-md h-10 w-full my-10" />
              <p>
                The height adjustment is done automatically, it just works™!
              </p>
              <div className="bg-gray-200 block rounded-md h-10 w-full my-10" />
            </details>
            <Button onClick={onDismiss} className="w-full">
              Dismiss
            </Button>
          </SheetContent>
        </BottomSheet>
      </Container>
    </>
  )
}

export default SimpleFixturePage
