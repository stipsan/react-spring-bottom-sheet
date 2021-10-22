import { createModel } from 'xstate/lib/model'

const sheetModel = createModel(
  {},
  {
    events: {
      OPEN: () => ({}),
      CLOSE: () => ({}),
      OPEN_IMMEDIATELY: () => ({}),
      CLOSE_START: () => ({}),
      CLOSE_END: () => ({}),
      DRAG_START: () => ({}),
      DRAG_END: () => ({}),
      SNAP_START: () => ({}),
      SNAP_END: () => ({}),
      RESIZE_START: () => ({}),
      RESIZE_END: () => ({}),
      OPEN_START: () => ({}),
      OPEN_END: () => ({}),
      AUTOFOCUS: () => ({}),
    },
  }
)

// TODO should be 1 in production
const delayFactor = 30

const machine = sheetModel.createMachine({
  context: sheetModel.initialContext,
  id: 'sheet',
  type: 'parallel',
  states: {
    mode: {
      id: 'mode',
      initial: 'mounting',
      states: {
        mounting: {
          on: { CLOSE: 'closed', OPEN: 'opening', OPEN_IMMEDIATELY: 'open' },
        },
        // most of the time we won't be in this state very long as the default wrapper component unmounts the sheet when it's closed
        closed: {
          entry: ['onClosed'],
          on: { OPEN: 'opening' },
        },
        opening: {
          entry: ['onOpeningStart'],
          exit: ['onOpeningEnd'],
          initial: 'preparing',
          states: {
            // opt-in to setup a11y stuff and such before the animation starts to avoid interrupting it and causing jank
            preparing: {
              entry: ['onPreparing'],
              on: {
                AUTOFOCUS: 'autofocusing',
                OPEN_START: 'animating',
              },
              after: {
                // generous last resort, if it's slow as 150ms it's already starting to feel too slow
                [150 * delayFactor]: { target: 'autofocusing' },
              },
            },
            // special case for animating from the bottom when a soft keyboard is used on iOS or Android
            // we attempt to fire it early, in a opacity=0 mode, to avoid awful jank on android and iOS caused by viewport changes
            // caused by the keyboard mid transition, so we attempt to let it show the keyboard and change the height first,
            // and then we do the open transition once the viewport height is hopefully stable
            autofocusing: {
              entry: ['onAutofocusing'],
              on: {
                OPEN_START: 'animating',
              },
              after: {
                // on some Android devices it can be really slow at showing the soft keyboard so we give it a couple of seconds
                [3000 * delayFactor]: { target: 'animating' },
              },
            },
            animating: {
              entry: ['onSpringStart'],
              exit: ['onSpringEnd'],
              on: {
                CLOSE: '#sheet.mode.closing',
                RESIZE_START: '#sheet.mode.open.resizing',
                SNAP_START: '#sheet.mode.open.snapping',
              },
              after: {
                // on some Android devices it can be really slow at showing the soft keyboard so we give it a couple of seconds
                [3000 * delayFactor]: { target: '#sheet.mode.open' },
              },
            },
          },
          on: {
            CLOSE: '#sheet.mode.closed',
            OPEN_END: '#sheet.mode.open',
            // DRAG events are allowed to interrupt the open transition at any time and respond to user input
            DRAG_START: '#sheet.mode.open.dragging',
          },
        },
        open: {
          entry: ['onOpen'],
          initial: 'idling',
          states: {
            idling: {
              on: {
                RESIZE_START: 'resizing',
                SNAP_START: 'snapping',
              },
            },
            // while dragging do not allow snap or resize events to take over the transition
            dragging: {
              entry: ['onDragStart'],
              exit: ['onDragEnd'],
              on: { DRAG_END: 'idling' },
            },
            // this is used when a resize event needs to be animated, in other cases we'll just transiently handle the resize state change
            resizing: {
              entry: ['onSpringStart'],
              exit: ['onSpringEnd'],
              on: {
                SNAP_START: 'snapping',
                RESIZE_END: 'idling',
              },
            },
            snapping: {
              entry: ['onSpringStart'],
              exit: ['onSpringEnd'],
              on: {
                RESIZE_START: 'resizing',
                SNAP_END: 'idling',
              },
            },
          },
          on: {
            CLOSE: '#sheet.mode.closing',
            // DRAG events respond to user input and should always be able to redirect a ongoing resize or snap transition to the user gesture
            DRAG_START: '.dragging',
          },
        },
        closing: {
          entry: ['onClosingStart'],
          exit: ['onClosingEnd'],
          initial: 'preparing',
          states: {
            // opt-in to setup a11y stuff and such before the animation starts to avoid interrupting it and causing jank
            preparing: {
              entry: ['onPreparing'],
              on: {
                CLOSE_START: 'animating',
                OPEN: '#sheet.mode.open',
              },
              after: {
                // generous last resort, if it's slow as 150ms it's already starting to feel too slow
                [150 * delayFactor]: { target: 'animating' },
              },
            },
            animating: {
              entry: ['onSpringStart'],
              // onSpringEnd checks if it were cancelled or not, and forwards a onSpringCancel instead of onSpringEnd to the public API when this happens
              exit: ['onSpringEnd'],
              on: {
                OPEN: '#sheet.mode.opening',
              },
              after: {
                // animation way too slow at 3s, cut it off
                [3000 * delayFactor]: { target: '#sheet.mode.closing' },
              },
            },
          },
          on: {
            CLOSE_END: '#sheet.mode.closed',
            DRAG_START: '#sheet.mode.open.dragging',
            SNAP_START: '#sheet.mode.open.snapping',
          },
        },
      },
    },
  },
})

export default machine
