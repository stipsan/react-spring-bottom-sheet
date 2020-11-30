Dragging, and transitions, need to be completely outside reacts render loop.
Stop relying on memo stuff.
If react's render loop triggers, communicate to outside fn's via refs and the like.
A change to snap points affects how far one can drag.

- minHeight should be renamed safeHeight or similar, as it denotes the smallest height while still being able to render the drag handle. Isn't it header height technically?
- maxHeight renamed to contentHeight, as that's what it is.
- rename initialHeight to initialSnapPoint.
- rename viewportHeight to maxHeight?
- rename isOpen to open, like the <details> tag works.
- rename setHeight to setSnapPoint

## package.json stuffs

- add description.
- add keywords.
- update readme.

# Credits

- Play icon: https://fontawesome.com/icons/play-circle?style=regular
- Phone frame used in logo: https://www.figma.com/community/file/896042888090872154/Mono-Devices-1.0
- iPhone frame used to wrap examples: https://www.figma.com/community/file/858143367356468985/(Variants)-iOS-%26-iPadOS-14-UI-Kit-for-Figma

# Ok let's map this nonsense

Consider using a

```js
const [, nextTick] = useState(0)
nextTick((_) => ++_)
```

to force updates.
Fast way to check if there's new snapPoints generated:

```js
var arr1 = [1, 2, 3, 4, 5]
var arr2 = [1, 2, 3, 4, 5]

if (JSON.stringify(arr1) === JSON.stringify(arr2)) {
  console.log('They are equal!')
}
```

## Changes that can happen from React's side of things at any time by means of a prop change

And that may affect side effects that are running atm

- isOpen
- snapPoints
- initialHeight

## Big picture state machines

- transitioning from closed to open.
- transition to closed while opening but not open.
- transition to open while closing.
- transition to closed after finished opening.
- while opening the user interrupts and starts dragging (should be fine, all work should be done by now.).

- Some hooks care only about if we're on our way to open, or on our way to close.
- Other hooks care about the current drag state.
- Dragging is king, should not be interruptible, but may allow side effects that affect where/how dragging happens.
