Dragging, and transitions, need to be completely outside reacts render loop.
Stop relying on memo stuff.
If react's render loop triggers, communicate to outside fn's via refs and the like.
A change to snap points affects how far one can drag.

```
max-content
  The intrinsic preferred width.
min-content
  The intrinsic minimum width.
fit-content(<length-percentage>)
  Uses the fit-content formula with the available space replaced by the specified argument, i.e. min(max-content, max(min-content, <length-percentage>)).

```

hmmmm

- currentHeight => height
- footerHeight => added
- headerHeight => added
- maxHeight => minHeight, includes header and footer heights, it tries to avoid a scrollbar
- minHeight => gone, used to be header + footer
- viewportHeight => maxHeight
- snap points array is optional

footerHeight
headerHeight
height
maxHeight
minHeight

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

Faux plugin architecture. "Plugins" or "hooks" can register in an es6 map if they want to do work before the animation starts, while the bottom sheet is resting in the final state but opacity: 0. This allows setting up focus lock, scroll lock and more ahead of time. Hopefully alleviating a lot of jank.

a transition to close can be cancelled if the open state is changed back to `true`.
open/close is fairly easy and stabl. snap to snap on the other hand, require diligence in making sure whoever cancels a snap transition, makes sure to send the animation on the right direction.

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
- while opening the user keyboard navs, maybe even fucks the scroll.

- Some hooks care only about if we're on our way to open, or on our way to close.
- Other hooks care about the current drag state.
- Dragging is king, should not be interruptible, but may allow side effects that affect where/how dragging happens.
- Except if the window changes height, maybe respond to header and footer height changes too by interrupting.
- Focus set by keyboard nav or a screen reader can fuck things up.
- Consider two drag modes? One fast, but can get scroll fuckups, one that's like the current one, safe because it changes the height property.