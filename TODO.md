Dragging, and transitions, need to be completely outside reacts render loop.
Stop relying on memo stuff.
If react's render loop triggers, communicate to outside fn's via refs and the like.
A change to snap points affects how far one can drag.

fix uneven icon that is being animated, the corner is driving me crazy...

# Remaining critical stuff

- respond to viewport height changes
- respond to snapTo callback
- fire events when stopping the dragging and transition to snap.
- respond to changes to snapPoints output
- don't respond to changes to defaultSnap, it shouldn't act like controlled height.
- optimize element resize observers, perhaps run them all in a chain.

## package.json stuffs

- add description.
- add keywords.
- update readme.

# A11y improvements

- support these: aria-labelledby="dialog1Title" aria-describedby="dialog1Desc"
- autoset aria-labbeledby if header is set and have content, figure this out

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

# useState bad, bad bad bad and useViewportHeight and useElementSizeObserver both use it

Rewrite to refs, the nextTick system. Create an initial step for getting all dimensions. Then setup observers that set refs.

Faux plugin architecture. "Plugins" or "hooks" can register in an es6 map if they want to do work before the animation starts, while the bottom sheet is resting in the final state but opacity: 0. This allows setting up focus lock, scroll lock and more ahead of time. Hopefully alleviating a lot of jank.

a transition to close can be cancelled if the open state is changed back to `true`.
open/close is fairly easy and stabl. snap to snap on the other hand, require diligence in making sure whoever cancels a snap transition, makes sure to send the animation on the right direction.

# Not important but don't forget

- openRef probably don't need to be passed down

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

tailwind rsbs

- focus-visible
- motion-reduce
- blue gray shades on content below header

important:
show inertia location to predict where sheet slides on release
