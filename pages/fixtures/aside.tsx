import type { NextPage } from 'next'
import { useEffect, useRef, useState } from 'react'
import Code from '../../docs/fixtures/Code'
import Container from '../../docs/fixtures/Container'
import SheetContent from '../../docs/fixtures/SheetContent'
import FakeMap from '../../docs/fixtures/FakeMap'
import { aside } from '../../docs/headings'
import MetaTags from '../../docs/MetaTags'
import { BottomSheet } from '../../src'
import type { BottomSheetRef } from '../../src'
import type { GetStaticProps } from '../_app'
import styles from '../../docs/fixtures/FakeMap.module.css'

export { getStaticProps } from '../_app'

const AsideFixturePage: NextPage<GetStaticProps> = ({
  description,
  homepage,
  meta,
  name,
}) => {
  const sheetRef = useRef<BottomSheetRef>(null)

  useEffect(() => {
    // Setting focus is to aid keyboard and screen reader nav when activating this iframe
    window.focus()
  }, [])

  return (
    <>
      <MetaTags
        {...meta}
        name={name}
        description={description}
        homepage={homepage}
        title={aside}
      />
      <Container>
        <FakeMap
          onClick={() =>
            sheetRef.current?.snapTo(({ headerHeight }) => headerHeight)
          }
        />
        <BottomSheet
          open
          className={styles.sheet}
          header={
            <input
              className="mt-1 block w-full rounded-md bg-gray-100 border-transparent focus:border-gray-300 focus:bg-white focus:ring-0"
              type="text"
              placeholder="Expands on focus"
              onFocus={() => {
                requestAnimationFrame(() => {
                  sheetRef.current?.snapTo(({ snapPoints }) =>
                    Math.max(...snapPoints)
                  )
                })
              }}
            />
          }
          ref={sheetRef}
          blocking={false}
          snapPoints={({ minHeight, headerHeight, maxHeight }) =>
            maxHeight < 667
              ? [headerHeight, minHeight / 2, minHeight - 20]
              : [headerHeight, Math.min(512, minHeight - 20), minHeight - 20]
          }
          defaultSnap={({ headerHeight }) => headerHeight}
        >
          <SheetContent>
            {Array.from(Array(10).keys()).map((_, i) => (
              <div key={i.toString()} className={styles.row} />
            ))}
          </SheetContent>
        </BottomSheet>
      </Container>
    </>
  )
}

export default AsideFixturePage
