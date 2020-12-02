/* eslint-disable no-self-compare */
import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock'

/**
 * Handle scroll locking to ensure a good dragging experience on Android and iOS.
 *
 * On iOS the following may happen if scroll isn't locked:
 * - When dragging the sheet the background gets dragged at the same time.
 * - When dragging the page scroll is also affected, causing the drag to feel buggy and "slow".
 *
 * On Android it causes the chrome toolbar to pop down as you drag down, and hide as you drag up.
 * When it's in between two toolbar states it causes the framerate to drop way below 60fps on
 * the bottom sheet drag interaction.
 */
export const createScrollLocker = (ref: HTMLElement) => {
  let restored = false

  return {
    activate: () => {
      disableBodyScroll(ref, {
        allowTouchMove: (el) => el.closest('[data-body-scroll-lock-ignore]'),
      })
    },
    deactivate: () => {
      // Ensure it's only run once, since this function is usually called twice:
      // 1.When the exit transition starts, usually in response to an onDismiss event from a user interaction
      // 2. When the component is unmounted.
      // Step 1 can sometimes be skipped, while step 2 always happens. One example where step 1 can be skipped is when
      // a parent component is unmounted, taking its children with it. In this case the exit transition never get a chance to happen.
      if (restored) {
        return
      }

      enableBodyScroll(ref)

      restored = true
    },
  }
}

// Handle hiding and restoring aria-hidden attributes
export const createAriaHider = (ref: HTMLElement) => {
  const originalValues: (null | string)[] = []
  const rootNodes: Element[] = []
  let restored = false

  return {
    activate: () => {
      const parentNode = ref.parentNode

      document.querySelectorAll('body > *').forEach((node) => {
        if (node === parentNode) {
          return
        }
        let attr = node.getAttribute('aria-hidden')
        let alreadyHidden = attr !== null && attr !== 'false'
        if (alreadyHidden) {
          return
        }
        originalValues.push(attr)
        rootNodes.push(node)
        node.setAttribute('aria-hidden', 'true')
      })
    },
    deactivate: () => {
      // Ensure it's only run once, since this function is usually called twice:
      // 1.When the exit transition starts, usually in response to an onDismiss event from a user interaction
      // 2. When the component is unmounted.
      // Step 1 can sometimes be skipped, while step 2 always happens. One example where step 1 can be skipped is when
      // a parent component is unmounted, taking its children with it. In this case the exit transition never get a chance to happen.
      if (restored) {
        return
      }

      rootNodes.forEach((node, index) => {
        let originalValue = originalValues[index]
        if (originalValue === null) {
          node.removeAttribute('aria-hidden')
        } else {
          node.setAttribute('aria-hidden', originalValue)
        }
      })

      restored = true
    },
  }
}

export const isNumber = (n: any) => !isNaN(parseFloat(n)) && isFinite(n)

// stolen from lodash
export function clamp(number: number, lower: number, upper: number) {
  number = +number
  lower = +lower
  upper = +upper
  lower = lower === lower ? lower : 0
  upper = upper === upper ? upper : 0
  if (number === number) {
    number = number <= upper ? number : upper
    number = number >= lower ? number : lower
  }
  return number
}

// Mwahaha easiest way to filter out NaN I ever saw! >:3
export function deleteNaN(arr) {
  const set = new Set(arr)
  set.delete(NaN)
  return [...set]
}

export function roundAndCheckForNaN(unrounded) {
  const rounded = Math.round(unrounded)
  if (Number.isNaN(unrounded)) {
    throw new TypeError(
      'Found a NaN! Check your snapPoints / defaultSnap / snapTo '
    )
  }

  return rounded
}
