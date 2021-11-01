import { createModel } from 'xstate/lib/model'
import { sendParent } from 'xstate'
import { roundAndCheckForNaN } from '../utils'

const maxHeightModel = createModel(
  {
    maxHeight: 0,
  },
  {
    events: {
      ENABLE_MAX_HEIGHT_FROM_WINDOW: () => ({}),
      MAX_HEIGHT: (value: number) => ({ value }),
      WINDOW_RESIZE: (value: number) => ({ value }),
      GET_HEIGHTS: () => ({}),
    },
  }
)
const maxHeightMachine = maxHeightModel.createMachine(
  {
    context: {
      maxHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
    },
    id: 'maxHeight',
    initial: 'window',
    states: {
      prop: {},
      window: {
        invoke: { src: 'onWindowResize' },
        on: {
          WINDOW_RESIZE: {
            actions: [
              maxHeightModel.assign({
                maxHeight: (context, event) => event.value,
              }),
              sendParent('RESIZE_MAX_HEIGHT'),
            ],
          },
        },
      },
    },
    on: {
      MAX_HEIGHT: {
        target: 'prop',
        actions: [
          maxHeightModel.assign({
            maxHeight: (context, event) => roundAndCheckForNaN(event.value),
          }),
          sendParent('RESIZE_MAX_HEIGHT'),
        ],
      },
      GET_HEIGHTS: { actions: 'sendHeight' },
    },
  },
  {
    actions: {
      sendHeight: sendParent((context, event) => ({
        type: 'SET_HEIGHTS',
        maxHeight: context.maxHeight,
      })),
    },
    services: {
      onWindowResize: (context, event) => (callback, onReceive) => {
        let raf: ReturnType<typeof requestAnimationFrame>
        const handleResize = () => {
          cancelAnimationFrame(raf)
          // throttle state changes using rAF
          raf = requestAnimationFrame(() => {
            callback({
              type: 'WINDOW_RESIZE',
              value: window.innerHeight,
            })
          })
        }
        window.addEventListener('resize', handleResize)
        callback({ type: 'WINDOW_RESIZE', value: window.innerHeight })

        return () => {
          window.removeEventListener('resize', handleResize)
          cancelAnimationFrame(raf)
        }
      },
    },
  }
)

export default maxHeightMachine
