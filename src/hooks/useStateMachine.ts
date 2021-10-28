import { send, spawn } from 'xstate'
import type { ContextFrom, EventFrom } from 'xstate'
import { createModel } from 'xstate/lib/model'

const resizeModel = createModel(
  {
    maxHeight: 0,
  },
  {
    events: {
      MAX_HEIGHT_FROM_WINDOW: (value: number) => ({ value }),
    },
  }
)
const resizeMachine = resizeModel.createMachine({})

export const sheetModel = createModel(
  {
    resizeRef: null,
    // Either window.innerHeight or the maxHeight prop
    maxHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
    headerHeight: 0,
    // The scroll height of the content area, not the height of the content scroll container
    contentHeight: 0,
    footerHeight: 0,
    snapPoints: [] as number[],
    // The height the sheet should transition to onOpen
    initialHeight: 0,
    // used by the initialHeight prop to allow restoring the sheet to its last position
    lastSnap: 0,
  },
  {
    events: {
      OPEN: () => ({}),
      CLOSE: () => ({}),
      OPEN_IMMEDIATELY: () => ({}),
      CLOSE_START: () => ({}),
      CLOSE_END: () => ({}),
      DRAG_START: () => ({}),
      DRAG_END: () => ({}),
      DRAG_SNAP: (y: number, velocity: number, swipe: number) => ({
        y,
        velocity,
        swipe,
      }),
      SNAP_START: () => ({}),
      SNAP_END: () => ({}),
      RESIZE_START: () => ({}),
      RESIZE_END: () => ({}),
      OPEN_START: () => ({}),
      OPEN_END: () => ({}),
      AUTOFOCUS: () => ({}),
      MAX_HEIGHT_FROM_WINDOW: (value: number) => ({ value }),
      MAX_HEIGHT_FROM_PROP: (value: number) => ({ value }),
      // Also does a state transition the first time to show it is being observed
      HEADER_HEIGHT: (value: number) => ({ value }),
      CONTENT_HEIGHT: (value: number) => ({ value }),
      FOOTER_HEIGHT: (value: number) => ({ value }),
    },
  }
)

// TODO rename to MachineContext and MachineEvent
export type SheetContext = ContextFrom<typeof sheetModel>
export type SheetEvent = EventFrom<typeof sheetModel>

// TODO should be 1 in production
const delayFactor = 30

const updateMaxHeightFromProp = sheetModel.assign(
  {
    maxHeight: (_, event) => {
      const maxHeight = event.value ?? 0
      if (!maxHeight) {
        throw new TypeError('maxHeight must be larger than 0')
      }
      return maxHeight
    },
  },
  'MAX_HEIGHT_FROM_PROP'
)
const updateMaxHeightFromWindow = sheetModel.assign(
  {
    maxHeight: (_, event) => {
      const maxHeight = event.value ?? 0
      if (!maxHeight) {
        throw new TypeError('maxHeight must be larger than 0')
      }
      return maxHeight
    },
  },
  'MAX_HEIGHT_FROM_WINDOW'
)
const updateHeaderHeight = sheetModel.assign(
  {
    headerHeight: (_, event) => event.value ?? 0,
  },
  'HEADER_HEIGHT'
)
const updateContentHeight = sheetModel.assign(
  {
    contentHeight: (_, event) => event.value ?? 0,
  },
  'CONTENT_HEIGHT'
)
const updateFooterHeight = sheetModel.assign(
  {
    footerHeight: (_, event) => event.value ?? 0,
  },
  'FOOTER_HEIGHT'
)

const machine = sheetModel.createMachine({
  context: sheetModel.initialContext,
  id: 'sheet',
  type: 'parallel',
  states: {
    mode: {
      initial: 'mounting',
      states: {
        mounting: {
          initial: 'waiting',
          states: {
            waiting: {
              after: {
                3000: {
                  actions: [
                    () => {
                      throw new Error(
                        'BottomSheet failed to trigger the initial OPEN or CLOSE event in time'
                      )
                    },
                  ],
                },
              },
            },
            pendingClosed: {
              always: [{ target: '#sheet.mode.closed', cond: 'ready' }],
            },
            pendingOpen: {
              always: [
                {
                  target: '#sheet.mode.opening',
                  cond: 'ready',
                },
              ],
            },
            pendingOpenImmediately: {
              always: [
                {
                  target: '#sheet.mode.opening',
                  cond: 'ready',
                },
              ],
            },
          },
          on: {
            CLOSE: '.pendingClosed',
            OPEN: '.pendingOpen',
            OPEN_IMMEDIATELY: '.pendingOpenImmediately',
          },
        },
        // most of the time we won't be in this state very long as the default wrapper component unmounts the sheet when it's closed
        closed: {
          entry: ['setSpringMode', 'onClosed'],
          on: { OPEN: 'opening' },
        },
        opening: {
          entry: ['setSpringMode', 'onOpeningStart'],
          exit: ['onOpeningEnd'],
          initial: 'preparing',
          states: {
            // opt-in to setup a11y stuff and such before the animation starts to avoid interrupting it and causing jank
            preparing: {
              invoke: {
                src: { type: 'activateDomHooksSync' },
                onError: {
                  target: 'autofocusing',
                  // actions
                },
                onDone: {
                  target: 'autofocusing',
                  // actions
                },
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
              entry: [
                'setSpringMode',
                'updateSnapPoints',
                'updateInitialHeight',
                'activateDomHooks',
              ],
              invoke: {
                src: {
                  type: 'autofocusMagicTrick',
                },
              },
              on: {
                OPEN_START: 'animating',
              },
              after: {
                // on some Android devices it can be really slow at showing the soft keyboard so we give it a couple of seconds
                [3000 * delayFactor]: { target: 'animating' },
              },
            },
            animating: {
              entry: [
                'setSpringMode',
                'updateSnapPoints',
                'updateInitialHeight',
                'onSpringStart',
              ],
              invoke: {
                src: 'springOpen',
              },
              exit: ['onSpringEnd'],
              on: {
                CLOSE: '#sheet.mode.closing.animating',
              },
            },
          },
          on: {
            CLOSE: '#sheet.mode.closed',
            OPEN_END: '#sheet.mode.open',
            // DRAG events are allowed to interrupt the open transition at any time and respond to user input
            DRAG_START: '#sheet.mode.open.dragging',
            // Same is true for SNAP events, as they can be triggered by keyboard users on the drag handle
            SNAP_START: '#sheet.mode.open.snapping',
          },
        },
        open: {
          entry: [
            'onOpen',
            sheetModel.assign({
              resizeRef: () => spawn(resizeMachine, 'resizeMachine'),
            }),
          ],
          invoke: [{ id: 'resizer', src: 'resizer' }],
          initial: 'idling',
          states: {
            idling: {
              entry: ['setSpringMode'],
              on: {
                // When idling we have the opportunity to allow the closing process to prepare before starting the animation
                CLOSE: '#sheet.mode.closing',
                RESIZE_START: 'resizing',
                SNAP_START: 'snapping',
                // Forwarding events to resizer
                MAX_HEIGHT_FROM_WINDOW: {
                  actions: [send({ type: 'RESIZE' }, { to: 'resizer' })],
                },
              },
            },
            // while dragging do not allow snap or resize events to take over the transition
            dragging: {
              entry: ['setSpringMode', 'onDragStart'],
              exit: ['onDragEnd'],
              on: {
                DRAG_END: 'idling',
                DRAG_SNAP: {
                  target: 'idling',
                  actions: ['springDrag'],
                },
              },
            },
            // this is used when a resize event needs to be animated, in other cases we'll just transiently handle the resize state change
            resizing: {
              entry: ['setSpringMode', 'onSpringStart'],
              exit: ['onSpringEnd'],
              on: {
                SNAP_START: 'snapping',
                RESIZE_END: 'idling',
              },
            },
            snapping: {
              entry: ['setSpringMode', 'onSpringStart'],
              exit: ['onSpringEnd'],
              on: {
                RESIZE_START: 'resizing',
                SNAP_END: 'idling',
              },
            },
          },
          on: {
            // DRAG events respond to user input and should always be able to redirect a ongoing resize or snap transition to the user gesture
            DRAG_START: '.dragging',
            // when resizing, dragging or snapping we have to transition directly to the closing animation state
            CLOSE: '#sheet.mode.closing.animating',
          },
        },
        closing: {
          entry: ['setSpringMode', 'onClosingStart'],
          exit: ['onClosingEnd'],
          initial: 'preparing',
          states: {
            // opt-in to setup a11y stuff and such before the animation starts to avoid interrupting it and causing jank
            preparing: {
              invoke: {
                src: { type: 'deactivateDomHooksSync' },
                onError: {
                  target: 'animating',
                  // actions
                },
                onDone: {
                  target: 'animating',
                  // actions
                },
              },
              on: {
                OPEN: '#sheet.mode.open',
              },
              after: {
                // generous last resort, if it's slow as 150ms it's already starting to feel too slow
                [150 * delayFactor]: { target: 'animating' },
              },
            },
            animating: {
              entry: ['onSpringStart'],
              invoke: {
                src: 'springClose',
              },
              // onSpringEnd checks if it were cancelled or not, and forwards a onSpringCancel instead of onSpringEnd to the public API when this happens
              exit: ['onSpringEnd'],
              on: {
                OPEN: '#sheet.mode.opening',
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
    maxHeight: {
      initial: 'fromWindow',
      states: {
        fromWindow: {},
        fromProp: {},
      },
      on: {
        MAX_HEIGHT_FROM_WINDOW: {
          target: '.fromWindow',
          actions: updateMaxHeightFromWindow,
        },
        MAX_HEIGHT_FROM_PROP: {
          target: '.fromProp',
          actions: updateMaxHeightFromProp,
        },
      },
    },
    headerHeight: {
      initial: 'mounting',
      states: {
        mounting: {
          after: {
            3000: {
              actions: [
                () => {
                  throw new Error(
                    'BottomSheet timed out while waiting for headerHeight to initialize'
                  )
                },
              ],
            },
          },
        },
        ready: {},
      },
      on: {
        HEADER_HEIGHT: {
          target: '.ready',
          actions: updateHeaderHeight,
        },
      },
    },
    contentHeight: {
      initial: 'mounting',
      states: {
        mounting: {
          after: {
            3000: {
              actions: [
                () => {
                  throw new Error(
                    'BottomSheet timed out while waiting for contentHeight to initialize'
                  )
                },
              ],
            },
          },
        },
        ready: {},
      },
      on: {
        CONTENT_HEIGHT: {
          target: '.ready',
          actions: updateContentHeight,
        },
      },
    },
    footerHeight: {
      initial: 'mounting',
      states: {
        mounting: {
          after: {
            3000: {
              actions: [
                () => {
                  throw new Error(
                    'BottomSheet timed out while waiting for footerHeight to initialize'
                  )
                },
              ],
            },
          },
        },
        ready: {},
      },
      on: {
        FOOTER_HEIGHT: {
          target: '.ready',
          actions: updateFooterHeight,
        },
      },
    },
  },
})

export default machine
