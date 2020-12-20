import { Machine } from 'xstate'

// This is the root machine, composing all the other machines and is the brain of the bottom sheet

interface MainStateSchema {
  states: {
    // the overlay usually starts in the closed position
    closed: {}
    opening: {
      states: {
        // Used to fire off the springStart event
        start: {}
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
        activating: {}
        // Animates from the bottom, note that it's either start => openImmediately => activating => end, or start => visuallyHidden => activating => openSmoothly => end
        openingSmoothly: {}
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
    snapping: {}
    closing: {}
  }
}

type MainEvent = { type: 'OPEN' } | { type: 'CLOSE' }

// The context (extended state) of the machine
interface MainContext {
  // @TODO
}
function sleep(ms = 10000) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const cancelOpen = {
  CLOSE: { target: '#overlay.closing', actions: 'onOpenCancel' },
}
const openToDrag = {
  DRAG: { target: '#overlay.dragging', actions: 'onOpenEnd' },
}

export const mainMachine = Machine<MainContext, MainStateSchema, MainEvent>(
  {
    id: 'overlay',
    initial: 'closed',
    context: {},
    states: {
      closed: { on: { OPEN: 'opening', CLOSE: undefined } },
      opening: {
        initial: 'start',
        states: {
          start: {
            invoke: {
              id: 'onOpenStart',
              src: 'onSpringStart',
              onDone: 'visuallyHidden',
            },
          },
          visuallyHidden: {
            invoke: { src: 'renderVisuallyHidden', onDone: 'activating' },
          },
          activating: {
            invoke: { src: 'activate', onDone: 'openingSmoothly' },
          },
          openingSmoothly: {
            invoke: { src: 'openSmoothly', onDone: 'end' },
            on: { ...openToDrag },
          },
          end: {
            invoke: { id: 'onOpenEnd', src: 'onSpringEnd', onDone: 'done' },
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
        on: { DRAG: '#overlay.dragging', SNAP: 'snapping' },
      },
      dragging: {
        entry: 'onDrag',
        on: { SNAP: 'snapping', DRAG: 'dragging' },
      },
      snapping: {
        initial: 'start',
        states: {
          start: {
            invoke: {
              id: 'onSnapStart',
              src: 'onSpringStart',
              onDone: 'snappingSmoothly',
            },
          },
          snappingSmoothly: {
            invoke: { src: 'openSmoothly', onDone: 'end' },
            on: { DRAG: { target: '#overlay.dragging', actions: 'onSnapEnd' } },
          },
          end: {
            invoke: { id: 'onSnapEnd', src: 'onSpringEnd', onDone: 'done' },
            on: { CLOSE: '#overlay.closing', DRAG: '#overlay.dragging' },
          },
          done: { type: 'final' },
        },
        on: { CLOSE: { target: '#overlay.closing', actions: 'onSnapCancel' } },
        onDone: 'open',
      },
      closing: { onDone: 'closed' },
    },
    on: {
      CLOSE: 'closing',
    },
  },
  {
    actions: {
      onSpringCancel: (context, event) => {
        console.log('onSpringCancel', { context, event })
      },
      onOpenCancel: (context, event) => {
        console.log('onOpenCancel', { context, event })
      },
      onOpenEnd: (context, event) => {
        console.log('onOpenCancel', { context, event })
      },
      onSnapEnd: (context, event) => {
        console.log('onSnapCancel', { context, event })
      },
      onDrag: (context, event) => {
        console.log('onDrag', { context, event })
      },
    },
    services: {
      // onSpringStart|onSpringEnd will await on the prop callbacks, allowing userland to delay transitions
      onSpringStart: async (context, event) => {
        console.group('onSpringStart')
        console.log({ context, event })
        await sleep()
        console.groupEnd()
      },
      onSpringEnd: async (context, event) => {
        console.group('onSpringEnd')
        console.log({ context, event })
        await sleep()
        console.groupEnd()
      },
      renderVisuallyHidden: async (context, event) => {
        console.group('renderVisuallyHidden')
        console.log({ context, event })
        await sleep()
        console.groupEnd()
      },
      activate: async (context, event) => {
        console.group('activate')
        console.log({ context, event })
        await sleep()
        console.groupEnd()
      },
      openSmoothly: async (context, event) => {
        console.group('openSmoothly')
        console.log({ context, event })
        await sleep()
        console.groupEnd()
      },
    },
  }
)
