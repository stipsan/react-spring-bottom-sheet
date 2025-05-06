import { assign, createMachine, fromPromise } from 'xstate'

// This is the root machine, composing all the other machines and is the brain of the bottom sheet

interface OverlayStateSchema {
  states: {
    // the overlay usually starts in the closed position
    closed: {}
    opening: {
      states: {
        // Used to fire off the springStart event
        start: {}
        // Decide how to transition to the open state based on what the initialState is
        transition: {}
        // Fast enter animation, sheet is open by default
        immediately: {
          states: {
            open: {}
            activating: {}
          }
        }
        smoothly: {
          states: {
            // This state only happens when the overlay should start in an open state, instead of animating from the bottom
            // openImmediately: {}
            // visuallyHidden will render the overlay in the open state, but with opacity 0
            // doing this solves two problems:
            // on Android focusing an input element will trigger the softkeyboard to show up, which will change the viewport height
            // on iOS the focus event will break the view by triggering a scrollIntoView event if focus happens while the overlay is below the viewport and body got overflow:hidden
            // by rendering things with opacity 0 we ensure keyboards and scrollIntoView all happen in a way that match up with what the sheet will look like.
            // we can then move it to the opening position below the viewport, and animate it into view without worrying about height changes or scrolling overflow:hidden events
            visuallyHidden: {}
            // In this state we're activating focus traps, scroll locks and more, this will sometimes trigger soft keyboards and scrollIntoView
            // @TODO we might want to add a delay here before proceeding to open, to give android and iOS enough time to adjust the viewport when focusing an interactive element
            activating: {}
            // Animates from the bottom
            open: {}
          }
        }
        // Used to fire off the springEnd event
        end: {}
        // And finally we're ready to transition to open
        done: {}
      }
    }
    open: {}
    // dragging responds to user gestures, which may interrupt the opening state, closing state or snapping
    // when interrupting an opening event, it fires onSpringEnd(OPEN) before onSpringStart(DRAG)
    // when interrupting a closing event, it fires onSpringCancel(CLOSE) before onSpringStart(DRAG)
    // when interrupting a dragging event, it fires onSpringCancel(SNAP) before onSpringStart(DRAG)
    dragging: {}
    // snapping happens whenever transitioning to a new snap point, often after dragging
    snapping: {
      states: {
        start: {}
        snappingSmoothly: {}
        end: {}
        done: {}
      }
    }
    resizing: {
      states: {
        start: {}
        resizingSmoothly: {}
        end: {}
        done: {}
      }
    }
    closing: {
      states: {
        start: {}
        deactivating: {}
        closingSmoothly: {}
        end: {}
        done: {}
      }
    }
  }
}

type OverlayEvent =
  | { type: 'OPEN' }
  | {
      type: 'SNAP'
      payload: {
        y: number
        velocity: number
        source: 'dragging' | 'custom' | string
      }
    }
  | { type: 'CLOSE' }
  | { type: 'DRAG' }
  | { type: 'RESIZE' }

// The context (extended state) of the machine
interface OverlayContext {
  initialState: 'OPEN' | 'CLOSED'
  snapSource?: 'dragging' | 'custom' | string
  y?: number
  velocity?: number
}
function sleep(ms = 1000) {
  return new Promise((resolve) => setTimeout(resolve, ms))
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

const initiallyOpen = ({ context }) => context.initialState === 'OPEN'
const initiallyClosed = ({ context }) => context.initialState === 'CLOSED'

// Copy paste the machine into https://xstate.js.org/viz/ to make sense of what's going on in here ;)

export const overlayMachine = createMachine(
  {
    types: {} as {
      context: OverlayContext
      services: {
        onSnapStart: () => Promise<void>
        onOpenStart: () => Promise<void>
        onCloseStart: () => Promise<void>
        onResizeStart: () => Promise<void>
        onSnapEnd: () => Promise<void>
        onOpenEnd: () => Promise<void>
        onCloseEnd: () => Promise<void>
        onResizeEnd: () => Promise<void>
        renderVisuallyHidden: () => Promise<void>
        activate: () => Promise<void>
        deactivate: () => Promise<void>
        openSmoothly: () => Promise<void>
        openImmediately: () => Promise<void>
        snapSmoothly: () => Promise<void>
        resizeSmoothly: () => Promise<void>
        closeSmoothly: () => Promise<void>
      }
    },
    id: 'overlay',
    initial: 'closed',
    context: {
      initialState: 'CLOSED',
    },
    states: {
      closed: { on: { OPEN: 'opening', CLOSE: undefined } },
      opening: {
        initial: 'start',
        states: {
          start: {
            invoke: {
              src: 'onOpenStart',
              onDone: 'transition',
            },
          },
          transition: {
            always: [
              { target: 'immediately', guard: 'initiallyOpen' },
              { target: 'smoothly', guard: 'initiallyClosed' },
            ],
          },
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
              visuallyHidden: {
                invoke: { src: 'renderVisuallyHidden', onDone: 'activating' },
              },
              activating: {
                invoke: { src: 'activate', onDone: 'open' },
              },
              open: {
                invoke: { src: 'openSmoothly', onDone: '#overlay.opening.end' },
                on: { ...openToDrag, ...openToResize },
              },
            },
          },
          end: {
            invoke: { src: 'onOpenEnd', onDone: 'done' },
            on: { CLOSE: '#overlay.closing', DRAG: '#overlay.dragging' },
          },
          done: {
            type: 'final',
          },
        },
        on: { ...cancelOpen },
        onDone: 'open',
      },
      open: {
        on: { DRAG: '#overlay.dragging', SNAP: 'snapping', RESIZE: 'resizing' },
      },
      dragging: {
        on: { SNAP: 'snapping' },
      },
      snapping: {
        initial: 'start',
        states: {
          start: {
            invoke: {
              src: 'onSnapStart',
              onDone: 'snappingSmoothly',
              input: ({ event: { payload } }) => ({
                y: payload.y,
                velocity: payload.velocity,
                snapSource: payload.source || 'custom',
              }),
            },
            entry: [
              assign(({ event: { payload } }) => {
                return {
                  y: payload.y,
                  velocity: payload.velocity,
                  snapSource: payload.source || 'custom',
                }
              }),
            ],
          },
          snappingSmoothly: {
            invoke: {
              src: 'snapSmoothly',
              onDone: 'end',
              input: ({ context }) => ({
                y: context.y,
                velocity: context.velocity,
                snapSource: context.snapSource,
              }),
            },
          },
          end: {
            invoke: { src: 'onSnapEnd', onDone: 'done' },
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
            invoke: {
              src: 'onResizeStart',
              onDone: 'resizingSmoothly',
            },
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
            invoke: {
              src: 'onCloseStart',
              onDone: 'deactivating',
            },
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
    actions: {
      onOpenCancel: (context, event) => {
        console.log('onOpenCancel', { context, event })
      },
      onSnapCancel: (context, event) => {
        console.log('onSnapCancel', { context, event })
      },
      onResizeCancel: (context, event) => {
        console.log('onResizeCancel', { context, event })
      },
      onCloseCancel: (context, event) => {
        console.log('onCloseCancel', { context, event })
      },
      onOpenEnd: (context, event) => {
        console.log('onOpenCancel', { context, event })
      },
      onSnapEnd: (context, event) => {
        console.log('onSnapEnd', { context, event })
      },
      onRezizeEnd: (context, event) => {
        console.log('onRezizeEnd', { context, event })
      },
    },
    actors: {
      onSnapStart: fromPromise(async () => {
        await sleep()
      }),
      onOpenStart: fromPromise(async () => {
        await sleep()
      }),
      onCloseStart: fromPromise(async () => {
        await sleep()
      }),
      onResizeStart: fromPromise(async () => {
        await sleep()
      }),
      onSnapEnd: fromPromise(async () => {
        await sleep()
      }),
      onOpenEnd: fromPromise(async () => {
        await sleep()
      }),
      onCloseEnd: fromPromise(async () => {
        await sleep()
      }),
      onResizeEnd: fromPromise(async () => {
        await sleep()
      }),
      renderVisuallyHidden: fromPromise(async ({ input, system }) => {
        console.group('renderVisuallyHidden')
        console.log({ input, system })
        await sleep()
        console.groupEnd()
      }),
      activate: fromPromise(async ({ input, system }) => {
        console.group('activate')
        console.log({ input, system })
        await sleep()
        console.groupEnd()
      }),
      deactivate: fromPromise(async ({ input, system }) => {
        console.group('deactivate')
        console.log({ input, system })
        await sleep()
        console.groupEnd()
      }),
      openSmoothly: fromPromise(async ({ input, system }) => {
        console.group('openSmoothly')
        console.log({ input, system })
        await sleep()
        console.groupEnd()
      }),
      openImmediately: fromPromise(async ({ input, system }) => {
        console.group('openImmediately')
        console.log({ input, system })
        await sleep()
        console.groupEnd()
      }),
      snapSmoothly: fromPromise(async ({ input, system }) => {
        console.group('snapSmoothly')
        console.log({ input, system })
        await sleep()
        console.groupEnd()
      }),
      resizeSmoothly: fromPromise(async ({ input, system }) => {
        console.group('resizeSmoothly')
        console.log({ input, system })
        await sleep()
        console.groupEnd()
      }),
      closeSmoothly: fromPromise(async ({ input, system }) => {
        console.group('closeSmoothly')
        console.log({ input, system })
        await sleep()
        console.groupEnd()
      }),
    },
    guards: { initiallyClosed, initiallyOpen },
  }
)
