import { assign, createMachine } from 'xstate'

// This is the root machine, composing all the other machines and is the brain of the bottom sheet
// Copy paste the machine into https://stately.ai/viz to make sense of what is going on in here ;)

export type SnapSource = 'dragging' | 'custom' | string

export type OverlayEvent =
  | { type: 'OPEN' }
  | {
      type: 'SNAP'
      payload: {
        y: number
        velocity: number
        source: SnapSource
      }
    }
  | { type: 'CLOSE' }
  | { type: 'DRAG' }
  | { type: 'RESIZE' }

export interface OverlayContext {
  initialState: 'OPEN' | 'CLOSED'
  snapSource?: SnapSource
  y?: number
  velocity?: number
}

export interface OverlayInput {
  initialState: 'OPEN' | 'CLOSED'
}

const cancelOpen = {
  CLOSE: { target: '#overlay.closing', actions: 'onOpenCancel' },
}
const openToDrag = {
  DRAG: { target: '#overlay.dragging', actions: 'onOpenEnd' },
}
const openToResize = {
  RESIZE: { target: '#overlay.resizing', actions: 'onOpenEnd' },
}

export const overlayMachine = createMachine(
  {
    types: {} as {
      context: OverlayContext
      events: OverlayEvent
      input: OverlayInput
    },
    id: 'overlay',
    initial: 'closed',
    context: ({ input }) => ({ initialState: input.initialState }),
    states: {
      // the overlay usually starts in the closed position
      closed: { on: { OPEN: 'opening', CLOSE: undefined } },
      opening: {
        initial: 'start',
        states: {
          // Used to fire off the springStart event
          start: {
            invoke: { src: 'onOpenStart', onDone: 'transition' },
          },
          // Decide how to transition to the open state based on what the initialState is
          transition: {
            always: [
              { target: 'immediately', guard: 'initiallyOpen' },
              { target: 'smoothly', guard: 'initiallyClosed' },
            ],
          },
          // Fast enter animation, sheet is open by default
          immediately: {
            initial: 'open',
            states: {
              open: {
                invoke: { src: 'openImmediately', onDone: 'activating' },
              },
              activating: {
                invoke: { src: 'activate', onDone: '#overlay.opening.end' },
                on: { ...openToDrag, ...openToResize },
              },
            },
          },
          smoothly: {
            initial: 'visuallyHidden',
            states: {
              // visuallyHidden renders the overlay in the open state, but with opacity 0.
              // On Android focusing an input triggers the soft keyboard, which changes the viewport height.
              // On iOS the focus event triggers scrollIntoView if focus happens while the overlay is below the viewport.
              // Rendering with opacity 0 first ensures keyboards and scrollIntoView happen in a way that match the final layout.
              visuallyHidden: {
                invoke: { src: 'renderVisuallyHidden', onDone: 'activating' },
              },
              // Activates focus traps, scroll locks and more
              activating: {
                invoke: { src: 'activate', onDone: 'open' },
              },
              // Animates from the bottom
              open: {
                invoke: { src: 'openSmoothly', onDone: '#overlay.opening.end' },
                on: { ...openToDrag, ...openToResize },
              },
            },
          },
          // Used to fire off the springEnd event
          end: {
            invoke: { src: 'onOpenEnd', onDone: 'done' },
            on: { CLOSE: '#overlay.closing', DRAG: '#overlay.dragging' },
          },
          done: { type: 'final' },
        },
        on: { ...cancelOpen },
        onDone: 'open',
      },
      open: {
        on: { DRAG: '#overlay.dragging', SNAP: 'snapping', RESIZE: 'resizing' },
      },
      // dragging responds to user gestures, which may interrupt opening, closing or snapping
      dragging: {
        on: { SNAP: 'snapping' },
      },
      // snapping happens whenever transitioning to a new snap point, often after dragging
      snapping: {
        initial: 'start',
        states: {
          start: {
            entry: assign(({ event }) =>
              event.type === 'SNAP'
                ? {
                    y: event.payload.y,
                    velocity: event.payload.velocity,
                    snapSource: event.payload.source || 'custom',
                  }
                : {}
            ),
            invoke: {
              src: 'onSnapStart',
              onDone: 'snappingSmoothly',
              input: ({ context }) => ({ snapSource: context.snapSource }),
            },
          },
          snappingSmoothly: {
            invoke: {
              src: 'snapSmoothly',
              onDone: 'end',
              input: ({ context }) => ({
                y: context.y,
                velocity: context.velocity,
              }),
            },
          },
          end: {
            invoke: {
              src: 'onSnapEnd',
              onDone: 'done',
              input: ({ context }) => ({ snapSource: context.snapSource }),
            },
            on: {
              RESIZE: '#overlay.resizing',
              SNAP: '#overlay.snapping',
              CLOSE: '#overlay.closing',
              DRAG: '#overlay.dragging',
            },
          },
          done: { type: 'final' },
        },
        on: {
          SNAP: { target: 'snapping', actions: 'onSnapEnd' },
          RESIZE: { target: '#overlay.resizing', actions: 'onSnapCancel' },
          DRAG: { target: '#overlay.dragging', actions: 'onSnapCancel' },
          CLOSE: { target: '#overlay.closing', actions: 'onSnapCancel' },
        },
        onDone: 'open',
      },
      resizing: {
        initial: 'start',
        states: {
          start: {
            invoke: { src: 'onResizeStart', onDone: 'resizingSmoothly' },
          },
          resizingSmoothly: {
            invoke: { src: 'resizeSmoothly', onDone: 'end' },
          },
          end: {
            invoke: { src: 'onResizeEnd', onDone: 'done' },
            on: {
              SNAP: '#overlay.snapping',
              CLOSE: '#overlay.closing',
              DRAG: '#overlay.dragging',
            },
          },
          done: { type: 'final' },
        },
        on: {
          RESIZE: { target: 'resizing', actions: 'onResizeEnd' },
          SNAP: { target: 'snapping', actions: 'onResizeCancel' },
          DRAG: { target: '#overlay.dragging', actions: 'onResizeCancel' },
          CLOSE: { target: '#overlay.closing', actions: 'onResizeCancel' },
        },
        onDone: 'open',
      },
      closing: {
        initial: 'start',
        states: {
          start: {
            invoke: { src: 'onCloseStart', onDone: 'deactivating' },
            on: { OPEN: { target: '#overlay.open', actions: 'onCloseCancel' } },
          },
          deactivating: {
            invoke: { src: 'deactivate', onDone: 'closingSmoothly' },
          },
          closingSmoothly: {
            invoke: { src: 'closeSmoothly', onDone: 'end' },
          },
          end: {
            invoke: { src: 'onCloseEnd', onDone: 'done' },
            on: {
              OPEN: { target: '#overlay.opening', actions: 'onCloseCancel' },
            },
          },
          done: { type: 'final' },
        },
        on: {
          CLOSE: undefined,
          OPEN: { target: '#overlay.opening', actions: 'onCloseCancel' },
        },
        onDone: 'closed',
      },
    },
    on: {
      CLOSE: '.closing',
    },
  },
  {
    guards: {
      initiallyOpen: ({ context }) => context.initialState === 'OPEN',
      initiallyClosed: ({ context }) => context.initialState === 'CLOSED',
    },
  }
)
