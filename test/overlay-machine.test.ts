import { describe, expect, it } from 'vitest'
import { createActor, fromPromise } from 'xstate'
import { overlayMachine } from '../src/machines/overlay'

const actorNames = [
  'onOpenStart',
  'onSnapStart',
  'onCloseStart',
  'onResizeStart',
  'onOpenEnd',
  'onSnapEnd',
  'onCloseEnd',
  'onResizeEnd',
  'renderVisuallyHidden',
  'activate',
  'deactivate',
  'openImmediately',
  'openSmoothly',
  'snapSmoothly',
  'resizeSmoothly',
  'closeSmoothly',
] as const

/** Starts the machine with every actor recording its name (and input) into a shared log */
function startMachine(initialState: 'OPEN' | 'CLOSED') {
  const calls: { name: string; input?: unknown }[] = []
  const actors = Object.fromEntries(
    actorNames.map((name) => [
      name,
      fromPromise(async ({ input }) => {
        calls.push({ name, input })
      }),
    ])
  )

  const actor = createActor(
    overlayMachine.provide({ actors: actors as never }),
    {
      input: { initialState },
    }
  ).start()

  return { actor, calls, names: () => calls.map((c) => c.name) }
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 50))

describe('overlay machine', () => {
  it('starts closed', () => {
    const { actor } = startMachine('CLOSED')
    expect(actor.getSnapshot().value).toBe('closed')
  })

  it('ignores CLOSE while already closed', async () => {
    const { actor, names } = startMachine('CLOSED')
    actor.send({ type: 'CLOSE' })
    await settle()
    expect(actor.getSnapshot().value).toBe('closed')
    expect(names()).not.toContain('onCloseStart')
  })

  // initialState is what skipInitialTransition drives: OPEN must not animate in from the bottom
  it('opens immediately when it starts open', async () => {
    const { actor, names } = startMachine('OPEN')
    actor.send({ type: 'OPEN' })
    await settle()
    expect(names()).toContain('openImmediately')
    expect(names()).not.toContain('openSmoothly')
    expect(names()).not.toContain('renderVisuallyHidden')
    expect(actor.getSnapshot().value).toBe('open')
  })

  it('opens smoothly when it starts closed', async () => {
    const { actor, names } = startMachine('CLOSED')
    actor.send({ type: 'OPEN' })
    await settle()
    expect(names()).toEqual([
      'onOpenStart',
      'renderVisuallyHidden',
      'activate',
      'openSmoothly',
      'onOpenEnd',
    ])
    expect(actor.getSnapshot().value).toBe('open')
  })

  it('passes the snap payload to the spring', async () => {
    const { actor, calls } = startMachine('OPEN')
    actor.send({ type: 'OPEN' })
    await settle()
    actor.send({
      type: 'SNAP',
      payload: { y: 240, velocity: 2, source: 'dragging' },
    })
    await settle()

    expect(calls.find((c) => c.name === 'snapSmoothly')?.input).toEqual({
      y: 240,
      velocity: 2,
    })
    expect(calls.find((c) => c.name === 'onSnapStart')?.input).toEqual({
      snapSource: 'dragging',
    })
    expect(actor.getSnapshot().value).toBe('open')
  })

  it('deactivates scroll lock and focus trap before animating closed', async () => {
    const { actor, names } = startMachine('OPEN')
    actor.send({ type: 'OPEN' })
    await settle()
    actor.send({ type: 'CLOSE' })
    await settle()

    const order = names()
    expect(order.indexOf('deactivate')).toBeLessThan(
      order.indexOf('closeSmoothly')
    )
    expect(actor.getSnapshot().value).toBe('closed')
  })

  it('lets a drag interrupt an in-flight open', async () => {
    const { actor } = startMachine('CLOSED')
    actor.send({ type: 'OPEN' })
    await new Promise((resolve) => setTimeout(resolve, 0))
    actor.send({ type: 'DRAG' })
    await settle()
    expect(actor.getSnapshot().value).toBe('dragging')
  })
})
