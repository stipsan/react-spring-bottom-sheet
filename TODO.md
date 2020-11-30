Dragging, and transitions, need to be completely outside reacts render loop.
Stop relying on memo stuff.
If react's render loop triggers, communicate to outside fn's via refs and the like.
A change to snap points affects how far one can drag.

- minHeight should be renamed safeHeight or similar, as it denotes the smallest height while still being able to render the drag handle. Isn't it header height technically?
- maxHeight renamed to contentHeight, as that's what it is.
- rename initialHeight to initialSnap.
- rename viewportHeight to maxHeight?

# Credits

- Play icon: https://fontawesome.com/icons/play-circle?style=regular
- Phone frame used in logo: https://www.figma.com/community/file/896042888090872154/Mono-Devices-1.0
- iPhone frame used to wrap examples: https://www.figma.com/community/file/858143367356468985/(Variants)-iOS-%26-iPadOS-14-UI-Kit-for-Figma
