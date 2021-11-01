import { interpret, spawn } from 'xstate'
import { useMemo } from 'react'
import { inspect } from '@xstate/inspect'
import { useLayoutEffect } from './useLayoutEffect'
import modeMachine, { modeModel } from '../machines/mode'
import maxHeightMachine from '../machines/maxHeight'
import withConfigResizeObserver from '../machines/resize'
import type { SpringRef } from '@react-spring/web'
import {
  getMaxContent,
  getMinContent,
  processSnapPoints as processSnapPointsLegacy,
  roundAndCheckForNaN,
  debugging,
} from '../utils'
import type {
  defaultSnapProps,
  snapPoints,
  SpringConfigMode,
  SpringState,
} from '../types'

if (debugging) {
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
  debugging: boolean
  snapPointsRef: React.RefObject<snapPoints>
  initialHeightRef: React.RefObject<
    number | ((props: defaultSnapProps) => number)
  >
  springRef: SpringRef<SpringState>
  springConfigRef: React.RefObject<
    (props: { mode: SpringConfigMode; velocity?: number }) => void
  >
  headerRef: React.RefObject<Element | null | undefined>
  contentRef: React.RefObject<Element | null | undefined>
  footerRef: React.RefObject<Element | null | undefined>
  onClosed: () => void
}

export default function useRootStateMachine({
  snapPointsRef,
  initialHeightRef,
  springRef,
  springConfigRef,
  headerRef,
  contentRef,
  footerRef,
  onClosed,
}: Props) {
  const service = useMemo(
    () =>
      interpret(
        modeMachine.withConfig({
          actions: {
            onClosed,
            spawnMachines: modeModel.assign({
              maxHeightRef: () => spawn(maxHeightMachine, 'maxHeight'),
              headerHeightRef: () =>
                withConfigResizeObserver(headerRef, 'headerHeight'),
              contentHeightRef: () =>
                withConfigResizeObserver(contentRef, 'contentHeight'),
              footerHeightRef: () =>
                withConfigResizeObserver(footerRef, 'footerHeight'),
            }),
            updateSnapPoints: modeModel.assign({
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
            updateInitialHeight: modeModel.assign({
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

                return context.initialHeight
              },
            }),
            springDrag: (context, event, ...args) => {
              springConfigRef.current({ mode: 'dragging' })
              console.log('onReceive', event, {
                context,
                event,
                args,
              })
              if (event.type === 'DRAG_SNAP') {
                const { snapPoints } = context
                const { y, velocity, swipe, direction } = event

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
                  config: { velocity: direction > 0 ? -velocity : velocity },
                })
              }
            },
          },
          services: {
            // starts to request snap points and other variables needed to slide in the sheet
            opening: (context, event) => (callback) => {
              springConfigRef.current({ mode: 'opening' })
              springRef.start({
                mode: 'opening',
                immediate: true,
              })
              callback('REQUEST_INITIAL_HEIGHT')
            },
            // Renders the sheet in a invisible state, to trigger soft keyboard animations before proceeding
            autofocusing: (context, event) => (callback, onReceive) => {
              springConfigRef.current({ mode: 'autofocusing' })
              springRef.start({
                mode: 'autofocusing',
                height: context.initialHeight,
                y: context.initialHeight,
                maxHeight: context.maxHeight,
                maxSnap: findMaxSnap(context.snapPoints),
                minSnap: findMinSnap(context.snapPoints),
                immediate: true,
              })
              const rAF = requestAnimationFrame(() => callback('OPEN'))

              return () => {
                cancelAnimationFrame(rAF)
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
                mode: 'opening',
                height: context.initialHeight,
                y: context.initialHeight,
                maxHeight: context.maxHeight,
                maxSnap: findMaxSnap(context.snapPoints),
                minSnap: findMinSnap(context.snapPoints),
                backdropOpacity: 1,
                contentOpacity: 1,
                // config: { velocity: 1 },
                onRest: () => callback('REST'),
              })

              return () => console.log('TODO handle the onSpringOpenCancel')
            },
            springClose: (context, event) => (callback, onReceive) => {
              springConfigRef.current({ mode: 'closing' })
              springRef.start({
                mode: 'closing',
                y: 0,
                backdropOpacity: 0,
                contentOpacity: 0,
                onRest: () => callback('CLOSE'),
              })

              return () => console.log('TODO handle the onSpringCloseCancel')
            },
          },
          guards: {
            validInitialHeight: (context) =>
              context.maxHeight !== null &&
              context.headerHeight !== null &&
              context.contentHeight !== null &&
              context.footerHeight !== null &&
              context.initialHeight > 0,
          },
        }),
        {
          devTools: debugging,
        }
      ).start(),
    [
      contentRef,
      footerRef,
      headerRef,
      initialHeightRef,
      onClosed,
      snapPointsRef,
      springConfigRef,
      springRef,
    ]
  )

  // https://xstate.js.org/docs/guides/states.html#state-methods-and-properties
  /* 
  const canRef = useRef(machine.initialState.can)
  const can = useCallback<typeof machine.initialState.can>(
    (event) => canRef.current(event),
    []
  )
  // */

  useLayoutEffect(() => {
    //@ts-expect-error
    if (window.changelog) {
      console.debug(
        'DEBUG dumping old changelog',
        //@ts-expect-error
        JSON.parse(JSON.stringify(window.changelog))
      )
    }
    //@ts-expect-error
    window.events = []
    //@ts-expect-error
    window.changelog = []
    // @ts-expect-error
    window.service = service

    service.subscribe(function setStateIfChanged(newState) {
      if (!debugging) return

      //@ts-expect-error
      window.events.push(JSON.parse(JSON.stringify(newState)))
      if (newState.changed) {
        //@ts-expect-error
        window.changelog.push(JSON.parse(JSON.stringify(newState)))
      }
    })
    return () => {
      console.warn('DEBUG stopping root state machine')
      service.stop()
    }
  }, [service])

  return { send: service.send }
}
