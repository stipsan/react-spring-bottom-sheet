// import { createMachine, interpret } from '@xstate/fsm'
import { createMachine, interpret } from 'xstate'
import cx from 'classnames'
import { useState, useEffect, useCallback, useMemo } from 'react'
import useConstant from 'use-constant'
import { inspect } from '@xstate/inspect'
import { useLayoutEffect } from './useLayoutEffect'
import machine from './useStateMachine'

if (typeof window !== 'undefined') {
  inspect({
    // options
    // url: 'https://statecharts.io/inspect', // (default)
    iframe: false, // open in new window
  })
}

type Props = {
  debugging?: boolean
}
export default function useRootStateMachine({ debugging = true }: Props = {}) {
  const service = useMemo(
    () =>
      interpret(
        machine.withConfig({
          actions: {
            onSpringStart: (...args) => console.log('onSpringStart', args),
          },
        }),
        {
          devTools: debugging,
        }
      ).start(),
    [debugging]
  )

  useLayoutEffect(() => {
    // @ts-ignore
    window.test = service

    service.subscribe(function setStateIfChanged(newState) {
      if (newState.changed) {
        console.log('changed', JSON.parse(JSON.stringify(newState)))
      }
    })
    return () => {
      console.log('stopping root state machine')
      service.stop()
    }
  }, [service])

  // const send = useMemo(() => service.send, [service])

  return [service.send]
}
