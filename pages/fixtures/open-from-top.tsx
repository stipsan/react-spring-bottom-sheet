import { openFromTop } from '../../docs/headings'
import MetaTags from '../../docs/MetaTags'
import { NextPage } from 'next'
import { GetStaticProps } from '../_app'
import { useEffect, useState } from 'react'
import Button from '../../docs/fixtures/Button'
import { BottomSheet } from '../../src'
import SheetContent from '../../docs/fixtures/SheetContent'
import Code from '../../docs/fixtures/Code'
import Kbd from '../../docs/fixtures/Kbd'
import Expandable from '../../docs/fixtures/Expandable'
import Container from '../../docs/fixtures/Container'
import styled from 'styled-components'

const OpenFromTop: NextPage<GetStaticProps> = ({
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
        title={openFromTop}
      />
      <Container>
        <Button onClick={() => setOpen(true)}>Open</Button>
        <TopSheet
          openFrom="top"
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
        </TopSheet>
      </Container>
    </>
  )
}

export default OpenFromTop

const TopSheet = styled(BottomSheet)`
  [data-rsbs-overlay] {
    border-bottom-left-radius: 16px;
    border-bottom-left-radius: var(--rsbs-overlay-rounded, 16px);
    border-bottom-right-radius: 16px;
    border-bottom-right-radius: var(--rsbs-overlay-rounded, 16px);
    flex-direction: column-reverse;
  }

  [data-rsbs-overlay],
  [data-rsbs-backdrop],
  [data-rsbs-root]:after {
    top: 0;
  }

  [data-rsbs-header]:before {
    bottom: calc(8px + env(safe-area-inset-top));
  }
`
