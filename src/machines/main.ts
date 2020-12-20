import { Machine } from 'xstate'

// This is the root machine, composing all the other machines and is the brain of the bottom sheet

interface MainStateSchema {
  states: {
    // the overlay usually starts in the closed position
    closed: {}
    opening: {
      states: {
        start: {}
        // staging will render the overlay in the open state, but visually hidden
        // doing this solves two problems:
        // on Android focusing an input element will trigger the softkeyboard to show up, which will change the viewport height
        // on iOS the focus event will break the view by triggering a scrollIntoView event if focus happens while the overlay is below the viewport and body got overflow:hidden
        // by rendering things with opacity 0 we ensure keyboards and scrollIntoView all happen in a way that match up with what the sheet will look like.
        // we can then move it to the opening position below the viewport, and animate it into view without worrying about height changes or scrolling overflow:hidden events
        staging: {}
        end: {}
      }
    }
    open: {}
    // dragging responds to user gestures, which may interrupt the opening state, closing state or snapping
    // when interrupting an opening event, it fires onSpringEnd(OPEN) before onSpringStart(DRAG)
    // when interrupting a closing event, it fires onSpringCancel(CLOSE) before onSpringStart(DRAG)
    // when interrupting a dragging event, it fires onSpringCancel(SNAP) before onSpringStart(DRAG)
    dragging: {}
    // snapping happens whenever transitioning to a new snap point, often after dragging
    snapping: {}
    closing: {}
  }
}

type MainEvent = { type: 'OPEN' } | { type: 'CLOSE' }

// The context (extended state) of the machine
interface MainContext {
  // @TODO
}

export const mainMachine = Machine<MainContext, MainStateSchema, MainEvent>({
  id: 'overlay',
  initial: 'closed',
  context: {},
  states: {
    closed: { on: { OPEN: 'opening' } },
    opening: {
      states: {
        start: {
          entry: 'onSpringStart',
        },
        staging: {
          invoke: [{ id: 'stage', src: 'stage' }],
          onDone: 'end',
        },
        end: {
          type: 'final',
        },
      },
      on: {
        CLOSE: { actions: 'onSpringCancel' },
      },
      onDone: 'open',
    },
    open: {},
    dragging: {},
    snapping: { onDone: 'open' },
    closing: { onDone: 'closed' },
  },
})
