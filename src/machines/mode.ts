import { send, forwardTo } from 'xstate'
import { createModel } from 'xstate/lib/model'
import type { ContextFrom, EventFrom } from 'xstate'

export const modeModel = createModel(
  {
    // spawned machines, they observe different states in real time, and the sheetMachine pulls them in when needed
    maxHeightRef: null,
    headerHeightRef: null,
    contentHeightRef: null,
    footerHeightRef: null,

    // Values pulled from spawned machines
    maxHeight: null as number,
    headerHeight: null as number,
    contentHeight: null as number,
    footerHeight: null as number,

    // State that is calculated by this machine
    snapPoints: [] as number[],
    // The height the sheet should transition to onOpen
    initialHeight: 0,
    // used by the initialHeight prop to allow restoring the sheet to its last position
    lastSnap: 0,
  },
  {
    events: {
      ENABLE_MAX_HEIGHT_FROM_WINDOW: () => ({}),
      MAX_HEIGHT: (value: number) => ({ value }),
      REQUEST_INITIAL_HEIGHT: () => ({}),
      RESPOND_INITIAL_HEIGHT: () => ({}),
      OPEN: () => ({}),
      CLOSE: () => ({}),
      REST: () => ({}),
      DRAG: () => ({}),
      RESIZE: () => ({}),
      SNAP: () => ({}),
      OPEN_IMMEDIATELY: () => ({}),
      CLOSE_START: () => ({}),
      CLOSE_END: () => ({}),
      DRAG_START: () => ({}),
      DRAG_END: () => ({}),
      DRAG_SNAP: (
        y: number,
        velocity: number,
        swipe: number,
        direction: number
      ) => ({
        y,
        velocity,
        swipe,
        direction,
      }),
      SNAP_START: () => ({}),
      SNAP_END: () => ({}),
      RESIZE_HEIGHT: () => ({}),
      RESIZE_MAX_HEIGHT: () => ({}),
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
      // resize observer
      OBSERVE_HEADER_HEIGHT: () => ({}),
      OBSERVE_CONTENT_HEIGHT: () => ({}),
      OBSERVE_FOOTER_HEIGHT: () => ({}),
      DISCONNECT_HEADER_HEIGHT: () => ({}),
      DISCONNECT_CONTENT_HEIGHT: () => ({}),
      DISCONNECT_FOOTER_HEIGHT: () => ({}),
      SET_HEIGHTS: (
        maxHeight?: number,
        headerHeight?: number,
        contentHeight?: number,
        footerHeight?: number
      ) => ({ maxHeight, headerHeight, contentHeight, footerHeight }),
    },
  }
)

export type ModeContext = ContextFrom<typeof modeModel>
export type ModeEvent = EventFrom<typeof modeModel>

const modeMachine = modeModel.createMachine({
  context: modeModel.initialContext,
  id: 'mode',
  entry: ['spawnMachines'],
  on: {
    MAX_HEIGHT: { actions: forwardTo('maxHeight') },
    ENABLE_MAX_HEIGHT_FROM_WINDOW: { actions: forwardTo('maxHeight') },
    OBSERVE_HEADER_HEIGHT: {
      actions: send({ type: 'OBSERVE_RESIZE' }, { to: 'headerHeight' }),
    },
    OBSERVE_CONTENT_HEIGHT: {
      actions: send({ type: 'OBSERVE_RESIZE' }, { to: 'contentHeight' }),
    },
    OBSERVE_FOOTER_HEIGHT: {
      actions: send({ type: 'OBSERVE_RESIZE' }, { to: 'footerHeight' }),
    },
    DISCONNECT_HEADER_HEIGHT: {
      actions: send({ type: 'DISCONNECT_RESIZE' }, { to: 'headerHeight' }),
    },
    DISCONNECT_CONTENT_HEIGHT: {
      actions: send({ type: 'DISCONNECT_RESIZE' }, { to: 'contentHeight' }),
    },
    DISCONNECT_FOOTER_HEIGHT: {
      actions: send({ type: 'DISCONNECT_RESIZE' }, { to: 'footerHeight' }),
    },
    REQUEST_INITIAL_HEIGHT: {
      actions: [
        send({ type: 'GET_HEIGHTS' }, { to: 'maxHeight' }),
        send({ type: 'GET_HEIGHTS' }, { to: 'headerHeight' }),
        send({ type: 'GET_HEIGHTS' }, { to: 'contentHeight' }),
        send({ type: 'GET_HEIGHTS' }, { to: 'footerHeight' }),
      ],
    },
    SET_HEIGHTS: {
      actions: [
        modeModel.assign({
          maxHeight: (context, event) => event.maxHeight ?? context.maxHeight,
          headerHeight: (context, event) =>
            event.headerHeight ?? context.headerHeight,
          contentHeight: (context, event) =>
            event.contentHeight ?? context.contentHeight,
          footerHeight: (context, event) =>
            event.footerHeight ?? context.footerHeight,
        }),
        'updateSnapPoints',
        'updateInitialHeight',
      ],
    },
  },
  initial: 'closed',
  states: {
    // most of the time we won't be in this state very long as the default wrapper component unmounts the sheet when it's closed
    closed: {
      on: { OPEN: 'open' },
    },
    open: {
      initial: 'opening',
      invoke: {
        src: 'springDrag',
      },
      states: {
        opening: {
          entry: ['onOpenStart', send('REQUEST_INITIAL_HEIGHT')],
          exit: ['onOpenEnd'],
          initial: 'waiting',
          states: {
            // Waiting for the initial height to be set
            waiting: {
              always: [
                {
                  target: 'autofocusing',
                  cond: 'validInitialHeight',
                },
              ],
              after: {
                // If we're not ready to transition by at least 1s something is wrong
                3000: {
                  actions: [
                    () => {
                      throw new Error(
                        'BottomSheet failed to compute a non-zero initialHeight in time'
                      )
                    },
                  ],
                },
              },
            },
            // special case for animating from the bottom when a soft keyboard is used on iOS or Android
            // we attempt to fire it early, in a opacity=0 mode, to avoid awful jank on android and iOS caused by viewport changes
            // caused by the keyboard mid transition, so we attempt to let it show the keyboard and change the height first,
            // and then we do the open transition once the viewport height is hopefully stable
            autofocusing: {
              invoke: {
                src: 'autofocusing',
              },
              on: {
                OPEN: 'animating',
              },
              after: {
                // on some Android devices it can be really slow at showing the soft keyboard so we give it a couple of seconds
                3000: { target: 'animating' },
              },
            },
            animating: {
              entry: [
                'onSpringStart',
                modeModel.assign({
                  lastSnap: (context) => context.initialHeight,
                }),
              ],
              invoke: {
                src: 'springOpen',
              },
              exit: ['onSpringEnd'],
            },
          },
          on: {
            REST: { target: 'resting', actions: ['onOpen'] },
          },
        },
        // open, and not doing anything
        resting: {
          on: {
            DRAG: 'dragging',
            RESIZE: 'resizing',
            SNAP: 'snapping',
            RESIZE_MAX_HEIGHT: {
              target: 'resizing',
              actions: [send({ type: 'GET_HEIGHTS' }, { to: 'maxHeight' })],
            },
            RESIZE_HEIGHT: {
              target: 'resizing',
              actions: [
                send({ type: 'GET_HEIGHTS' }, { to: 'headerHeight' }),
                send({ type: 'GET_HEIGHTS' }, { to: 'contentHeight' }),
                send({ type: 'GET_HEIGHTS' }, { to: 'footerHeight' }),
              ],
            },
          },
        },
        // while dragging do not allow snap or resize events to take over the transition
        dragging: {
          invoke: {
            src: 'dragging',
          },
          on: {
            REST: 'resting',
            DRAG_SNAP: {
              target: 'resting',
              actions: ['springDrag'],
            },
          },
        },
        // this is used when a resize event needs to be animated, in other cases we'll just transiently handle the resize state change
        resizing: {
          invoke: {
            src: 'resizing',
          },
          on: {
            REST: 'resting',
          },
        },
        snapping: {
          invoke: {
            src: 'snapping',
          },
          on: {
            REST: 'resting',
          },
        },
        closing: {
          entry: ['onCloseStart'],
          exit: ['onEnd'],
          invoke: {
            src: 'springClose',
          },
          on: {
            CLOSE: { target: '#mode.closed', actions: ['onClosed'] },
          },
        },
      },
      on: {
        CLOSE: '.closing',
      },
    },
  },
})

export default modeMachine
