// import { createMachine, interpret } from '@xstate/fsm'
import { createMachine, interpret, send } from 'xstate'
import cx from 'classnames'
import { useState, useEffect, useCallback, useMemo } from 'react'
import useConstant from 'use-constant'
import { inspect } from '@xstate/inspect'
import { useLayoutEffect } from './useLayoutEffect'
import machine, { sheetModel } from './useStateMachine'
import type { SheetContext, SheetEvent } from './useStateMachine'
import type { SpringRef } from '@react-spring/web'
import {
  getMaxContent,
  getMinContent,
  processSnapPoints as processSnapPointsLegacy,
  roundAndCheckForNaN,
} from '../utils'
import type {
  defaultSnapProps,
  snapPoints,
  springConfig,
  SpringConfigMode,
} from '../types'
import {
  animated,
  useSpring,
  useSpringRef,
  config,
  to,
} from '@react-spring/web'

if (typeof window !== 'undefined') {
  inspect({
    // options
    // url: 'https://statecharts.io/inspect', // (default)
    iframe: false, // open in new window
  })
}

function processSnapPoints(snapPoints: number | number[], maxHeight) {
  const { snapPoints: snapPointsLegacy } = processSnapPointsLegacy(
    snapPoints,
    maxHeight
  )
  return snapPointsLegacy
}

function findSnapPoint(snapPoints: number[], unsafeNumber: number) {
  const querySnap = roundAndCheckForNaN(unsafeNumber)
  return snapPoints.reduce(
    (prev, curr) =>
      Math.abs(curr - querySnap) < Math.abs(prev - querySnap) ? curr : prev,
    Math.min(...snapPoints)
  )
}

function findMaxSnap(snapPoints: number[]) {
  return Math.max(...snapPoints)
}

function findMinSnap(snapPoints: number[]) {
  return Math.min(...snapPoints)
}

type Props = {
  debugging?: boolean
  snapPointsRef: React.RefObject<snapPoints>
  initialHeightRef: React.RefObject<
    number | ((props: defaultSnapProps) => number)
  >
  springRef: SpringRef
  springConfigRef: React.RefObject<
    (props: { mode: SpringConfigMode; velocity?: number }) => void
  >
  activateDomHooks: () => Promise<void>
  deactivateDomHooks: () => Promise<void>
  activateFocusLock: () => Promise<void>
}
export default function useRootStateMachine({
  debugging = true,
  snapPointsRef,
  initialHeightRef,
  springRef,
  springConfigRef,
  activateDomHooks,
  deactivateDomHooks,
  activateFocusLock,
}: Props) {
  const service = useMemo(
    () =>
      interpret(
        machine.withConfig({
          actions: {
            openImmediately: () => {
              throw new TypeError('openImmediately not yet implemented')
            },
            updateSnapPoints: sheetModel.assign({
              snapPoints: (context) => {
                const { footerHeight, contentHeight, headerHeight, maxHeight } =
                  context
                const nextSnapPoints = processSnapPoints(
                  snapPointsRef.current({
                    footerHeight,
                    contentHeight,
                    headerHeight,
                    maxHeight,
                    minContent: getMinContent(context),
                    maxContent: getMaxContent(context),
                  }),
                  maxHeight
                )
                if (nextSnapPoints.length > 0) {
                  return nextSnapPoints
                }

                throw new TypeError(
                  `The snapPoints prop have to return an array with at least one value, instead it returned ${JSON.stringify(
                    nextSnapPoints
                  )}`
                )
              },
            }),
            updateInitialHeight: sheetModel.assign({
              initialHeight: (context, event) => {
                const {
                  snapPoints,
                  footerHeight,
                  contentHeight,
                  headerHeight,
                  maxHeight,
                  lastSnap,
                } = context

                const nextInitialHeight = findSnapPoint(
                  snapPoints,
                  typeof initialHeightRef.current === 'function'
                    ? initialHeightRef.current({
                        footerHeight,
                        headerHeight,
                        contentHeight,
                        minContent: getMinContent(context),
                        maxContent: getMaxContent(context),
                        maxHeight,
                        snapPoints,
                        lastSnap,
                      })
                    : initialHeightRef.current
                )

                if (nextInitialHeight > 0) {
                  return nextInitialHeight
                }

                throw new TypeError(
                  `The initialHeight prop have to return a number larger than 0, instead it returned ${JSON.stringify(
                    nextInitialHeight
                  )}`
                )
              },
            }),
            onOpeningStart: () => {
              //
            },
            onOpen: () => {
              //
            },
            onClosingStart: () => {
              //
            },
            onClosed: () => {
              //
            },
            activateDomHooks: () => {
              activateDomHooks()
            },
            setSpringMode: (context, event, { state }) => {
              console.groupEnd()
              switch (true) {
                case state.matches('mode.opening.autofocusing'):
                  console.group('mode.opening.autofocusing')
                  return springRef.start({
                    mode: 'autofocusing',
                    immediate: true,
                  })
                case state.matches('mode.opening'):
                  console.group('mode.opening')
                  return springRef.start({ mode: 'opening', immediate: true })
                case state.matches('mode.open.dragging'):
                  console.group('mode.open.dragging')
                  return springRef.start({ mode: 'dragging', immediate: true })
                case state.matches('mode.open.resizing'):
                  console.group('mode.open.resizing')
                  return springRef.start({ mode: 'resizing', immediate: true })
                case state.matches('mode.open.snapping'):
                  console.group('mode.open.snapping')
                  return springRef.start({ mode: 'snapping', immediate: true })
                case state.matches('mode.open'):
                  console.group('mode.open')
                  return springRef.start({ mode: 'open', immediate: true })
                case state.matches('mode.closing'):
                  console.group('mode.closing')
                  return springRef.start({ mode: 'closing', immediate: true })
                case state.matches('mode.closed'):
                  console.group('mode.closed')
                  return springRef.start({ mode: 'closed', immediate: true })
              }
            },
            springDrag: (context, event, ...args) => {
              springConfigRef.current({ mode: 'dragging' })
              console.log('onReceive', event, { context, event, args })
              if (event.type === 'DRAG_SNAP') {
                const { snapPoints } = context
                const { y, velocity, swipe } = event

                const nextY = findSnapPoint(
                  snapPoints,
                  swipe > 0
                    ? y - velocity * 100
                    : swipe < 0
                    ? y + velocity * 100
                    : y
                )

                springRef.start({
                  y: nextY,
                  height: nextY,
                  config: { velocity },
                })
              }
            },
            onDragStart: () => {
              // springConfigRef.current({ mode: 'dragging' })
            },
            onDragEnd: (context, event, { state }) => {
              if (event.type === 'DRAG_END') {
                const { snapPoints } = context
                const { y, velocity, swipe } = event

                console.log('DRAG_END', findSnapPoint(snapPoints, event.y), {
                  y,
                  velocity,
                  swipe,
                })
              }
            },
          },
          services: {
            activateDomHooksSync: () => activateDomHooks(),
            deactivateDomHooksSync: () => deactivateDomHooks(),
            // Renders the sheet in a invisible state, to trigger soft keyboard animations before proceeding
            autofocusMagicTrick: (context, event) => (callback, onReceive) => {
              activateFocusLock()
              springConfigRef.current({ mode: 'autofocusing' })
              springRef.start({
                height: context.initialHeight,
                y: context.initialHeight,
                maxHeight: context.maxHeight,
                maxSnap: findMaxSnap(context.snapPoints),
                minSnap: findMinSnap(context.snapPoints),
                immediate: true,
              })

              if ('requestIdleCallback' in window) {
                requestIdleCallback(() => callback('OPEN_START'), {
                  timeout: 5000,
                })
              } else {
                setTimeout(() => callback('OPEN_START'), 50)
              }
              // TODO implment it properly, check if autofocus will happen, skip when possible and detect viewport resizes on android to increase the timeout to reduce jank

              return () => {
                springRef.start({
                  y: 0,
                  immediate: true,
                })
              }
            },
            springOpen: (context, event) => (callback, onReceive) => {
              springConfigRef.current({ mode: 'opening' })
              // TODO debug, write tests, that deal with how the config is changed
              /*
              console.log(
                'needle',
                springRef.current[0].springs.y.animation.config.velocity
              )
              // */
              springRef.start({
                height: context.initialHeight,
                y: context.initialHeight,
                maxHeight: context.maxHeight,
                maxSnap: findMaxSnap(context.snapPoints),
                minSnap: findMinSnap(context.snapPoints),
                backdropOpacity: 1,
                contentOpacity: 1,
                // config: { velocity: 1 },
                onRest: () => callback('OPEN_END'),
              })

              return () => console.log('TODO handle the onSpringOpenCancel')
            },
            springClose: (context, event) => (callback, onReceive) => {
              springConfigRef.current({ mode: 'closing' })
              springRef.start({
                y: 0,
                backdropOpacity: 0,
                contentOpacity: 0,
                onRest: () => callback('CLOSE_END'),
              })

              return () => console.log('TODO handle the onSpringCloseCancel')
            },
          },
          guards: {
            ready: (context, event, { state }) =>
              state.matches('headerHeight.ready') &&
              state.matches('contentHeight.ready') &&
              state.matches('footerHeight.ready'),
          },
        }),
        {
          devTools: debugging,
        }
      ).start(),
    [activateDomHooks, debugging, initialHeightRef, snapPointsRef, springRef]
  )

  useLayoutEffect(() => {
    // @ts-expect-error
    window.test = service

    service.subscribe(function setStateIfChanged(newState) {
      if (newState.changed) {
        console.log(
          'changed',
          newState.event.type,
          JSON.parse(JSON.stringify(newState))
        )
      }
    })
    return () => {
      console.log('stopping root state machine')
      service.stop()
    }
  }, [service])

  // const send = useMemo(() => service.send, [service])
  const isMounting = useCallback(
    () => service.state.matches('mode.mounting'),
    [service]
  )

  return { send: service.send, isMounting }
}
