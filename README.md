# React Spring Bottom Sheet (React 18)

[![npm stat](https://img.shields.io/npm/dm/@nipe-solutions/react-spring-bottom-sheet.svg?style=flat-square)](https://npm-stat.com/charts.html?package=@nipe-solutions/react-spring-bottom-sheet)
[![npm version](https://img.shields.io/npm/v/@nipe-solutions/react-spring-bottom-sheet.svg?style=flat-square)](https://www.npmjs.com/package/@nipe-solutions/react-spring-bottom-sheet)
[![Netlify Status](https://api.netlify.com/api/v1/badges/6348db32-4930-4fca-a11d-c3098c9fda4f/deploy-status)](https://app.netlify.com/sites/react-spring-bottom-sheet-updated/deploys)
[![module formats: cjs, es, and modern][module-formats-badge]][unpkg-dist]
 

![Logo with the text Accessible, Delightful and Performant](https://react-spring-bottom-sheet.nipesolutions.com/readme.svg)

## 🌟 About This Version

### ✨ Updated Version

This project is an updated version of the original, which was authored by Cody Olsen. I have forked this repository from Jasmine GH to include significant updates and enhancements. Notably, this version has been updated to fully support React 18 and incorporates the latest features and improvements from XState v5.

### 📝 Attribution

I am not the original author of this software. The original creation was by Cody Olsen, and my fork is based on the work maintained by Jasmine GH. Please refer to the original repositories for historical context and previous versions of the software. My contributions are focused on compatibility enhancements and feature updates to keep the project aligned with current development practices and library versions.

## 🔗 Repository Links

- Original Author's Repository: [Cody Olsen's GitHub](https://github.com/stipsan/react-spring-bottom-sheet)
- Forked Version I Based My Work On: [Jasmine GH's GitHub](https://github.com/JasGH/react-spring-bottom-sheet)

**react-spring-bottom-sheet** is built on top of **[react-spring]** and **[react-use-gesture]**. It busts the myth that accessibility and supporting keyboard navigation and screen readers are allegedly at odds with delightful, beautiful, and highly animated UIs. Every animation and transition use CSS custom properties instead of manipulating them directly, allowing complete control over the experience from CSS alone.

## Installation

```bash
npm i @nipe-solutions/react-spring-bottom-sheet
```

## Getting started

### Basic usage

```jsx
import { useState } from 'react'
import { BottomSheet } from '@nipe-solutions/react-spring-bottom-sheet'

// if setting up the CSS is tricky, you can add this to your page somewhere:
// <link rel="stylesheet" href="https://unpkg.com/@nipe-solutions/react-spring-bottom-sheet/dist/style.css" crossorigin="anonymous">
import '@nipe-solutions/react-spring-bottom-sheet/dist/style.css'

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

### TypeScript

TS support is baked in, and if you're using the `snapTo` API use `BottomSheetRef`:

```tsx
import { useRef } from 'react'
import { BottomSheet, BottomSheetRef } from '@nipe-solutions/react-spring-bottom-sheet'

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
      importFrom: require.resolve('@nipe-solutions/react-spring-bottom-sheet/defaults.json'),
    },
  },
}
```

## [Demos](https://react-spring-bottom-sheet.nipesolutions.com/)

### [Basic](https://react-spring-bottom-sheet.nipesolutions.com/fixtures/simple)

> [View demo code](/pages/fixtures/simple.tsx#L44-L48)

MVP example, showing what you get by implementing `open`, `onDismiss` and a single **snap point** always set to `minHeight`.

### [Snap points & overflow](https://react-spring-bottom-sheet.nipesolutions.com/fixtures/scrollable)

> [View demo code](/pages/fixtures/scrollable.tsx#L86-L97)

A more elaborate example that showcases how snap points work. It also shows how it behaves if you want it to be open by default, and not closable. Notice how it responds if you resize the window, or scroll to the bottom and starts adjusting the height of the sheet without scrolling back up first.

### [Sticky header & footer](https://react-spring-bottom-sheet.nipesolutions.com/fixtures/sticky)

> [View demo code](/pages/fixtures/sticky.tsx#L41-L61)

If you provide either a `header` or `footer` prop you'll enable the special behavior seen in this example. And they're not just sticky positioned, both areas support touch gestures.

### [Non-blocking overlay mode](https://react-spring-bottom-sheet.nipesolutions.com/fixtures/aside)

> [View demo code](/pages/fixtures/aside.tsx#L41-L53)

In most cases you use a bottom sheet the same way you do with a dialog: you want it to overlay the page and block out distractions. But there are times when you want a bottom sheet but without it taking all the attention and overlaying the entire page. Providing `blocking={false}` helps this use case. By doing so you disable a couple of behaviors that are there for accessibility (focus-locking and more) that prevents a screen reader or a keyboard user from accidentally leaving the bottom sheet.


## API

### props

All props you provide, like `className`, `style` props or whatever else are spread onto the underlying `<animated.div>` instance, that you can style in your custom CSS using this selector: `[data-rsbs-root]`.
Just note that the component is mounted in a `@reach/portal` at the bottom of `<body>`, and not in the DOM hierarchy you render it in.

#### open

Type: `boolean`

The only required prop, beyond `children`. And it's controlled, so if you don't set this to `false` then it's not possible to close the bottom sheet. It's worth knowing that the bottom sheet won't render anything but a `@reach/dialog` placeholder while `open` is `false`. Thus ensure your components behave as expected with being unmounted when the sheet closed. We can't really allow it to render and mount while in a closed/hidden position as there's no stable way of preventing keyboard users or screen readers from accidentally interacting with the closed bottom sheet as long as it's in the dom. This is especially problematic given it implements ARIA to optimize for a11y.

#### onDismiss

Type: `() => void`

Called when the user do something that signal they want to dismiss the sheet:

- hit the `esc` key.
- tap on the backdrop.
- swipes the sheet to the bottom of the viewport.

#### snapPoints

Type: `(state) => number | number[]`

This function should be pure as it's called often. You can choose to provide a single value or an array of values to customize the behavior. The `state` contains these values:

- `headerHeight` – the current measured height of the `header`.
- `footerHeight` – if a `footer` prop is provided then this is its height.
- `height` – the current height of the sheet.
- `minHeight` – the minimum height needed to avoid a scrollbar. If there's not enough height available to avoid it then this will be the same as `maxHeight`.
- `maxHeight` – the maximum available height on the page, equivalent to `window.innerHeight` and `100vh`.

```jsx
<BottomSheet
  // Allow the user to select between minimun height to avoid a scrollbar, and fullscren
  snapPoints={({ minHeight, maxHeight }) => [minHeight, maxHeight]}
/>
```

#### defaultSnap

Type: `number | (state) => number`

Provide either a number, or a callback returning a number for the default position of the sheet when it opens.
`state` use the same arguments as `snapPoints`, plus two more values: `snapPoints` and `lastSnap`.

```jsx
<BottomSheet
  // the first snap points height depends on the content, while the second one is equivalent to 60vh
  snapPoints={({ minHeight, maxHeight }) => [minHeight, maxHeight / 0.6]}
  // Opens the largest snap point by default, unless the user selected one previously
  defaultSnap={({ lastSnap, snapPoints }) =>
    lastSnap ?? Math.max(...snapPoints)
  }
/>
```

#### header

Type: `ReactNode`

Supports the same value type as the `children` prop.

#### footer

Type: `ReactNode`

Supports the same value type as the `children` prop.

#### sibling

Type: `ReactNode`

Supports the same value type as the `sibling` prop. Renders the node as a child of `[data-rsbs-root]`, but as a sibling to `[data-rsbs-backdrop]` and `[data-rsbs-overlay]`. This allows you to access the animation state and render elements on top of the bottom sheet, while being outside the overlay itself.

#### initialFocusRef

Type: `React.Ref | false`

A react ref to the element you want to get keyboard focus when opening.
If not provided it's automatically selecting the first interactive element it finds.
If set to false keyboard focus when opening is disabled.

#### blocking

Type: `boolean`

Enabled by default. Enables focus trapping of keyboard navigation, so you can't accidentally tab out of the bottom sheet and into the background. Also sets `aria-hidden` on the rest of the page to prevent Screen Readers from escaping as well.

#### scrollLocking

Type: `boolean`

iOS Safari, and some other mobile culprits, can be tricky if you're on a page that has scrolling overflow on `document.body`. Mobile browsers often prefer scrolling the page in these cases instead of letting you handle the touch interaction for UI such as the bottom sheet. Thus it's enabled by default. However it can be a bit agressive and can affect cases where you're putting a drag and drop element inside the bottom sheet. Such as `<input type="range" />` and more. For these cases you can wrap them in a container and give them this data attribute `[data-body-scroll-lock-ignore]` to prevent intervention. Really handy if you're doing crazy stuff like putting mapbox-gl widgets inside bottom sheets.

#### expandOnContentDrag

Type: `boolean`

Disabled by default. By default, a user can expand the bottom sheet only by dragging a header or the overlay. This option enables expanding the bottom sheet on the content dragging.

#### springConfig

Type: `{ mass: number; tension: number; friction: number }`

Helps you to customize the movement and speed of the animations.

```jsx
<BottomSheet
  // Animation faster than the default
  springConfig={{mass: 0.1, tension: 370, friction: 26}}
/>
```

### Events

All events receive `SpringEvent` as their argument. The payload varies, but `type` is always present, which can be `'OPEN' | 'RESIZE' | 'SNAP' | 'CLOSE'` depending on the scenario.

#### onSpringStart

Type: `(event: SpringEvent) => void`

Fired on: `OPEN | RESIZE | SNAP | CLOSE`.

If you need to delay the open animation until you're ready, perhaps you're loading some data and showing an inline spinner meanwhile. You can return a Promise or use an async function to make the bottom sheet wait for your work to finish before it starts the open transition.

```jsx
function Example() {
  const [data, setData] = useState([])
  return (
    <BottomSheet
      onSpringStart={async (event) => {
        if (event.type === 'OPEN') {
          // the bottom sheet gently waits
          const data = await fetch(/* . . . */)
          setData(data)
          // and now we can proceed
        }
      }}
    >
      {data.map(/* . . . */)}
    </BottomSheet>
  )
}
```

#### onSpringCancel

Type: `(event: SpringEvent) => void`

Fired on: `OPEN | CLOSE`.

##### OPEN

In order to be as fluid and delightful as possible, the open state can be interrupted and redirected by the user without waiting for the open transition to complete. Maybe they changed their mind and decided to close the sheet because they tapped a button by mistake. This interruption can happen in a number of ways:

- the user swipes the sheet below the fold, triggering an `onDismiss` event.
- the user hits the `esc` key, triggering an `onDismiss` event.
- the parent component sets `open` to `false` before finishing the animation.
- a `RESIZE` event happens, like when an Android device shows its soft keyboard when an text editable input receives focus, as it changes the viewport height.

##### CLOSE

If the user reopens the sheet before it's done animating it'll trigger this event. Most importantly though it can fire if the bottom sheet is unmounted without enough time to clean animate itself out of the view before it rolls back things like `body-scroll-lock`, `focus-trap` and more. It'll still clean itself up even if React decides to be rude about it. But this also means that the event can fire after the component is unmounted, so you should avoid calling setState or similar without checking for the mounted status of your own wrapper component.

##### RESIZE

Type: `{ source: 'window' | 'maxheightprop' | 'element }`

Fires whenever there's been a window resize event, or if the header, footer or content have changed its height in such a way that the valid snap points have changed.
`source` tells you what caused the resize. If the resize comes from a `window.onresize` event it's set to `'window'`. `'maxheightprop'` is if the `maxHeight` prop is used, and is fired whenever it changes. And `'element'` is whenever the header, footer or content resize observers detect a change.

##### SNAP

Type: `{ source: 'dragging' | 'custom' | string }`

Fired after dragging ends, or when calling `ref.snapTo`, and a transition to a valid snap point is happening.

`source` is `'dragging'` if the snapping is responding to a drag gesture that just ended. And it's set to `'custom'` when using `ref.snapTo`.

```jsx
function Example() {
  return (
    <BottomSheet
      onSpringStart={(event) => {
        if (event.type === 'SNAP' && event.source === 'dragging') {
          console.log('Starting a spring animation to user selected snap point')
        }
      }}
    />
  )
}
```

When using `snapTo` it's possible to use a different `source` than `'custom'`:

```jsx
function Example() {
  const sheetRef = useRef()
  return (
    <BottomSheet
      ref={sheetRef}
      snapPoints={({ minHeight, maxHeight }) => [minHeight, maxHeight]}
      onSpringEnd={(event) => {
        if (event.type === 'SNAP' && event.source === 'snap-to-bottom') {
          console.log(
            'Just finished an imperativ transition to the bottom snap point'
          )
        }
      }}
    >
      <button
        onClick={() => sheetRef.current.snapTo(0, { source: 'snap-to-bottom' })}
      >
        Snap to bottom
      </button>
    </BottomSheet>
  )
}
```

#### onSpringEnd

Type: `(event: SpringEvent) => void`

Fired on: `CLOSE`.

The `yin` to `onSpringStart`'s `yang`. It has the same characteristics. Including `async/await` and Promise support for delaying a transition. For `CLOSE` it gives you a hook into the step right after it has cleaned up everything after itself, and right before it unmounts itself. This can be useful if you have some logic that needs to perform some work before it's safe to unmount.

#### skipInitialTransition

Type: `boolean`

By default the initial open state is always transitioned to using an spring animation. Set `skipInitialTransition` to `true` and the initial `open` state will render as if it were the default state. Useful to avoid scenarios where the opening transition would be distracting.

### ref

Methods available when setting a `ref` on the sheet:

```jsx
export default function Example() {
  const sheetRef = React.useRef()
  return <BottomSheet open ref={sheetRef} />
}
```

#### snapTo

Type: `(numberOrCallback: number | (state => number)) => void, options?: {source?: string, velocity?: number}`

Same signature as the `defaultSnap` prop, calling it will animate the sheet to the new snap point you return. You can either call it with a number, which is the height in px (it'll select the closest snap point that matches your value): `ref.current.snapTo(200)`. Or:

```js
ref.current.snapTo(({ // Showing all the available props
  headerHeight, footerHeight, height, minHeight, maxHeight, snapPoints, lastSnap }) =>
  // Selecting the largest snap point, if you give it a number that doesn't match a snap point then it'll
  // select whichever snap point is nearest the value you gave
  Math.max(...snapPoints)
)
```

There's an optional second argument you can use to override `event.source`, as well as changing the `velocity`:

```js
ref.current.snapTo(({ snapPoints }) => Math.min(...snapPoints), {
  // Each property is optional, here showing their default values
  source: 'custom',
  velocity: 1,
})
```

#### height

Type: `number`

The current snap point, in other words the height, of the bottom sheet. This value is updated outside the React render cycle, for performance reasons.

```jsx
export default function Example() {
  const sheetRef = React.useRef()
  return (
    <BottomSheet
      ref={sheetRef}
      onSpringStart={() => {
        console.log('Transition from:', sheetRef.current.height)
        requestAnimationFrame(() =>
          console.log('Transition to:', sheetRef.current.height)
        )
      }}
      onSpringEnd={() =>
        console.log('Finished transition to:', sheetRef.current.height)
      }
    />
  )
}
```

## Credits

- Play icon used on frame overlays: [font-awesome](https://fontawesome.com/icons/play-circle?style=regular)
- Phone frame used in logo: [Mono Devices 1.0](https://www.figma.com/community/file/896042888090872154/Mono-Devices-1.0)
- iPhone frame used to wrap examples: [iOS 14 UI Kit for Figma](<https://www.figma.com/community/file/858143367356468985/(Variants)-iOS-%26-iPadOS-14-UI-Kit-for-Figma>)

[gzip-badge]: http://img.badgesize.io/https://unpkg.com/@nipe-solutions/react-spring-bottom-sheet/dist/index.es.js?compression=gzip&label=gzip%20size&style=flat-square
[size-badge]: http://img.badgesize.io/https://unpkg.com/@nipe-solutions/react-spring-bottom-sheet/dist/index.es.js?label=size&style=flat-square
[unpkg-dist]: https://unpkg.com/@nipe-solutions/react-spring-bottom-sheet/dist/
[module-formats-badge]: https://img.shields.io/badge/module%20formats-cjs%2C%20es%2C%20modern-green.svg?style=flat-square
[react-spring]: https://github.com/pmndrs/react-spring
[react-use-gesture]: https://github.com/pmndrs/react-use-gesture
