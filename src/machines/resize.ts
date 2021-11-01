import { createModel } from 'xstate/lib/model'
import { spawn, sendParent } from 'xstate'
import { ResizeObserverOptions } from '@juggle/resize-observer/lib/ResizeObserverOptions'
import { calculateBoxSize } from '@juggle/resize-observer/lib/algorithms/calculateBoxSize'
import { ResizeObserver as Polyfill } from '@juggle/resize-observer'

const ResizeObserver =
  (typeof window !== 'undefined' && window.ResizeObserver) || Polyfill

const resizeModel = createModel(
  {
    height: 0,
    mode:
      typeof window !== 'undefined' && window.ResizeObserver
        ? 'native'
        : 'polyfill',
  },
  {
    events: {
      OBSERVE_RESIZE: () => ({}),
      DISCONNECT_RESIZE: () => ({}),
      RESIZE_HEIGHT: (value: number) => ({ value }),
      GET_HEIGHTS: () => ({}),
    },
  }
)
const resizeMachine = resizeModel.createMachine({
  context: resizeModel.initialContext,
  id: 'resize',
  initial: 'disconnected',
  states: {
    disconnected: {
      on: {
        OBSERVE_RESIZE: 'observed',
      },
    },
    observed: {
      invoke: {
        src: 'observe',
      },
      on: {
        RESIZE_HEIGHT: {
          actions: [
            resizeModel.assign({
              height: (context, event) => event.value,
            }),
            sendParent('RESIZE_HEIGHT'),
          ],
        },
        DISCONNECT_RESIZE: 'disconnected',
      },
    },
  },
  on: {
    GET_HEIGHTS: { actions: 'sendHeight' },
  },
})
const observerOptions: ResizeObserverOptions = {
  // Respond to changes to padding, happens often on iOS when using env(safe-area-inset-bottom)
  // And the user hides or shows the Safari browser toolbar
  box: 'border-box',
}
const withConfigResizeObserver = (
  ref: React.RefObject<Element | null | undefined>,
  id: string
) =>
  spawn(
    resizeMachine.withConfig({
      actions: {
        sendHeight: sendParent((context, event) => ({
          type: 'SET_HEIGHTS',
          [id]: context.height,
        })),
      },
      services: {
        observe: (context, event) => (callback, onReceive) => {
          if (ref?.current) {
            const resizeObserver = new ResizeObserver((entries) => {
              // we only observe one element, so accessing the first entry here is fine
              callback({
                type: 'RESIZE_HEIGHT',
                value:
                  entries?.[0]?.borderBoxSize?.[0]?.blockSize ??
                  calculateBoxSize(ref.current, observerOptions.box as any)
                    .blockSize,
              })
            })
            resizeObserver.observe(ref.current, observerOptions)
            // Set initial height right away so we're ready for opening the sheet

            callback({
              type: 'RESIZE_HEIGHT',
              value: calculateBoxSize(ref.current, observerOptions.box as any)
                .blockSize,
            })
            // */

            return () => {
              resizeObserver.disconnect()
            }
          }
        },
      },
    }),
    id
  )

export default withConfigResizeObserver
