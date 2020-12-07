# Get started

## Installation

```bash
npm i react-spring-bottom-sheet
```

## Basic usage

```jsx
import { useState } from 'react'
import { BottomSheet } from 'react-spring-bottom-sheet'

// if setting up the CSS is tricky, you can add this to your page somewhere:
// <link rel="stylesheet" href="https://unpkg.com/react-spring-bottom-sheet/dist/style.css" crossorigin="anonymous">
import 'react-spring-bottom-sheet/dist/style.css'

export default function Example() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      <BottomSheet open={open}>My awesome content here</BottomSheet>
    </>
  )
}
```

## TypeScript

TS support is baked in, and if you're using the `snapTo` API use `BottomSheetRef`:

```tsx
import { useRef } from 'react'
import { BottomSheet, BottomSheetRef } from 'react-spring-bottom-sheet'

export default function Example() {
  const sheetRef = useRef<BottomSheetRef>()
  return (
    <BottomSheet open ref={sheetRef}>
      <button
        onClick={() => {
          // Full typing for the arguments available in snapTo, yay!!
          sheetRef.current.snapTo(({ maxHeight }) => maxHeight)
        }}
      >
        Expand to full height
      </button>
    </BottomSheet>
  )
}
```

## Customizing the CSS

### Using CSS Custom Properties

These are all the variables available to customize the look and feel when using the [provided](/src/style.css) CSS.

```css
:root {
  --rsbs-backdrop-bg: rgba(0, 0, 0, 0.6);
  --rsbs-bg: #fff;
  --rsbs-handle-bg: hsla(0, 0%, 0%, 0.14);
  --rsbs-max-w: auto;
  --rsbs-ml: env(safe-area-inset-left);
  --rsbs-mr: env(safe-area-inset-right);
  --rsbs-overlay-rounded: 16px;
}
```

### Custom CSS

It's recommended that you copy from [style.css](/src/style.css) into your own project, and add this to your `postcss.config.js` setup (`npm i postcss-custom-properties-fallback`):

```js
module.exports = {
  plugins: {
    // Ensures the default variables are available
    'postcss-custom-properties-fallback': {
      importFrom: require.resolve('react-spring-bottom-sheet/defaults.json'),
    },
  },
}
```
