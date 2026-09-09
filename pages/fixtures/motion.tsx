import type { NextPage } from 'next'
import { useState } from 'react'
import Button from '../../docs/fixtures/Button'
import Code from '../../docs/fixtures/Code'
import Container from '../../docs/fixtures/Container'
import SheetContent from '../../docs/fixtures/SheetContent'
import { motion } from '../../docs/headings'
import MetaTags from '../../docs/MetaTags'
import { BottomSheet, presets } from '../../src'
import type { SpringConfig } from '../../src'
import type { GetStaticProps } from '../_app'

export { getStaticProps } from '../_app'

const recipes: {
  key: string
  label: string
  blurb: string
  config: Partial<SpringConfig>
}[] = [
  {
    key: 'linear',
    label: 'Linear',
    blurb: 'The current default. Constant speed, so it stops dead on arrival.',
    config: presets.linear,
  },
  {
    key: 'eased',
    label: 'Eased',
    blurb:
      'Leaves fast and settles. Reaches 90% of the travel at the same moment linear does, so it reads as the same speed.',
    config: presets.eased,
  },
  {
    key: 'material',
    label: 'Material',
    blurb:
      "Material 3's motion for a surface entering: 300ms on the emphasized decelerate curve. Reaches 90% of the travel at 108ms, so it is not slower where you notice it.",
    config: presets.material,
  },
  {
    key: 'springy',
    label: 'Spring',
    blurb:
      'Real physics. Short snaps are quick, long ones carry momentum, and your drag velocity feeds into it.',
    config: presets.springy,
  },
]

const MotionFixturePage: NextPage<GetStaticProps> = ({
  description,
  homepage,
  meta,
  name,
}) => {
  const [open, setOpen] = useState(false)
  const [recipe, setRecipe] = useState(recipes[0])

  // Rendered through `sibling` so it stays above the backdrop and clickable while the
  // sheet is open, which is the whole point of being able to compare recipes back to back
  const switcher = (
    <div className="fixed inset-x-0 top-0 z-10 flex flex-col items-center gap-2 p-4">
      <div className="flex flex-wrap justify-center gap-2">
        {recipes.map((r) => (
          <Button
            key={r.key}
            onClick={() => {
              setRecipe(r)
              setOpen(true)
            }}
            className={
              r.key === recipe.key ? 'ring-2 ring-gray-400' : undefined
            }
          >
            {r.label}
          </Button>
        ))}
      </div>
      <Code>{JSON.stringify(serialize(recipe.config))}</Code>
    </div>
  )

  return (
    <>
      <MetaTags
        {...meta}
        name={name}
        description={description}
        homepage={homepage}
        title={motion}
      />
      <Container>
        {/* While the sheet is open the same switcher is rendered through `sibling`,
            which is the only way to stay above the backdrop and keep taking taps */}
        {!open && switcher}
        <p className="max-w-md px-6 text-center text-gray-600">
          Pick a recipe, then drag the sheet between snap points. The difference
          shows up most on a long throw. Switching stays available while the
          sheet is open.
        </p>

        <BottomSheet
          // Remounts on change so each recipe starts from a clean spring
          key={recipe.key}
          open={open}
          onDismiss={() => setOpen(false)}
          springConfig={recipe.config}
          sibling={switcher}
          defaultSnap={({ snapPoints }) => Math.min(...snapPoints)}
          snapPoints={({ maxHeight }) => [
            maxHeight * 0.25,
            maxHeight * 0.6,
            maxHeight * 0.95,
          ]}
          header={<span>{recipe.label}</span>}
        >
          <SheetContent>
            <p>
              Drag the handle up and down. With <Code>Linear</Code> a short snap
              and a long one take exactly the same time, so the long one looks
              slow and the short one looks abrupt.
            </p>
            <p>
              <Code>Spring</Code> is the only recipe where the speed follows the
              distance and how hard you flick.
            </p>
            <Button onClick={() => setOpen(false)} className="w-full">
              Close
            </Button>
          </SheetContent>
        </BottomSheet>
      </Container>
    </>
  )
}

/** easing is a function, so it needs a readable stand-in for display */
function serialize(config: Partial<SpringConfig>) {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(config)) {
    out[key] = typeof value === 'function' ? 'easing fn' : value
  }
  return out
}

export default MotionFixturePage
