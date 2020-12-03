// Keeps track of wether everything is good to go or not, in the most efficient way possible

import { useCallback, useEffect, useState } from 'react'

export function useReady() {
  const [ready, setReady] = useState(false)
  const [readyMap, updateReadyMap] = useState<{ [key: string]: boolean }>({})

  const registerReady = useCallback((key: string) => {
    console.count(`registerReady:${key}`)
    // Register the check we're gonna wait for until it's ready
    updateReadyMap((ready) => ({ ...ready, [key]: false }))

    return () => {
      console.count(`setReady:${key}`)
      // Set it to ready
      updateReadyMap((ready) => ({ ...ready, [key]: true }))
    }
  }, [])

  useEffect(() => {
    const states = Object.values(readyMap)

    if (states.length === 0) {
      console.log('nope nothing registered yet')
      return
    }

    const isReady = states.every(Boolean)
    console.log('check if we are rready', readyMap, isReady)
    if (isReady) {
      console.warn('ready!')
      setReady(true)
    }
  }, [readyMap])

  return { ready, registerReady }
}
