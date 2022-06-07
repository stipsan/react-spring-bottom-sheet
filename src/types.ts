import type {
  GetInitialHeight,
  GetInitialHeightProps,
  GetSnapPoints,
} from '@bottom-sheet/types'

/**
 * `window` comes from window.onresize, maxheightprop is if the `maxHeight` prop is used, and `element` comes from the resize observers that listens to header, footer and the content area
 */
export type ResizeSource = 'window' | 'maxheightprop' | 'element'

/* Might make sense to expose a preventDefault method here */
export type SpringEvent =
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'RESIZE'; source: ResizeSource }
  | { type: 'SNAP'; source: 'dragging' | 'custom' | string }

export type Props = {
  /**
   * Ensure that whatever you put in here have at least 1px height, or else the bottom sheet won't open
   */
  children: React.ReactNode

  /**
   * Similar to children, but renders next to the overlay element rather than inside it.
   * Useful for things that are position:fixed and need to overlay the backdrop and still be interactive
   * in blocking mode.
   */
  sibling?: React.ReactNode

  /**
   * Start a transition from closed to open, open to closed, or snap to snap.
   * Return a promise or async to delay the start of the transition, just remember it can be cancelled.
   */
  onSpringStart?: (event: SpringEvent) => void
  /**
   * A running transition didn't finish or got stopped, this event isn't awaited on and might happen
   * after the sheet is unmounted (if it were in the middle of something).
   */
  onSpringCancel?: (event: SpringEvent) => void
  /**
   * The transition ended successfully. Handy to know when it's safe to unmount
   * the sheet without interrupting the closing animation.
   * Return a promise or async to delay the start of the transition, just remember it can be cancelled.
   */
  onSpringEnd?: (event: SpringEvent) => void

  /** Whether the bottom sheet is open or not. */
  open: boolean

  /**
   * Additional CSS class for the container.
   */
  className?: string

  /**
   * Renders a sticky footer at the bottom of the sheet.
   */
  footer?: React.ReactNode

  /**
   * Renders below the drag handle, set to `false` to disable the drag handle
   * @default true
   */
  header?: React.ReactNode | false

  /**
   * A reference to the element that should be focused. By default it'll be the first interactive element.
   * Set to false to disable keyboard focus when opening.
   */
  initialFocusRef?: React.RefObject<HTMLElement> | false

  /**
   * Handler that is called when the user presses *esc*, clicks outside the dialog or drags the sheet to the bottom of the display.
   */
  onDismiss?: () => void

  /**
   * Whether the bottom sheet should block interactions with the rest of the page or not.
   * @default true
   */
  blocking?: boolean

  /**
   * By default the maxHeight is set to window.innerHeight to match 100vh, and responds to window resize events.
   * You can override it by giving maxHeight a number, just make sure you handle things like resize events when needed.
   */
  maxHeight?: number

  /**
   * Ensures that drag interactions works properly on iOS and Android.
   * If setting this to `false`make sure you test on real iOS and Android devices to ensure the dragging interactions don't break.
   * @default true
   */
  scrollLocking?: boolean

  /**
   * Handler that is called to get the height values that the bottom sheet can *snap* to when the user stops dragging.
   * @default ({ maxContent }) => maxContent
   * TODO: support number, to create a distributed range between minContent, maxContent and maxHeight
   *       given minContent: 100, maxContent: 200, maxHeight: 300 and snapPoints={50} then create [100, 150, 200, 250, 300]
   */
  snapPoints?: GetSnapPoints

  /**
   * Handler that is called to get the initial height of the bottom sheet when it's opened (or when the viewport is resized).
   * @default ({ lastHeight, snapPoints }) => lastHeight ?? snapPoints[0]
   */
  initialHeight?: number | GetInitialHeight

  /**
   * Configures body-scroll-lock to reserve scrollbar gap by setting padding on <body>, clears when closing the bottom sheet.
   * If blocking is true, then reserveScrollBarGap is true by default
   * @default blocking === true
   */
  reserveScrollBarGap?: boolean

  /**
   * Open immediatly instead of initially animating from a closed => open state, useful if the bottom sheet is visible by default and the animation would be distracting
   */
  skipInitialTransition?: boolean

  /**
   * Expand the bottom sheet on the content dragging. By default user can expand the bottom sheet only by dragging the header or overlay. This option enables expanding on dragging the content.
   * @default expandOnContentDrag === false
   */
  expandOnContentDrag?: boolean

  /**
   * Renders a debugging GUI that shows internal state in real-time.
   * @default false
   */
  unstable__debug?: boolean
} & Omit<React.PropsWithoutRef<JSX.IntrinsicElements['div']>, 'children'>

export interface RefHandles {
  /**
   * When given a number it'll find the closest snap point, so you don't need to know the exact value,
   * Use the callback method to access what snap points you can choose from.
   *
   * Use the second argument for advanced settings like:
   * `source: string` which is passed to onSpring events, and is 'custom' by default
   * `velocity: number` which is 1 by default, adjust it to control the speed of the spring transition to the new snap point
   */
  snapTo: (
    numberOrCallback:
      | number
      | ((state: GetInitialHeightProps & { height: number }) => number),
    options?: { source?: string; velocity?: number }
  ) => void

  /**
   * Returns the current snap point, in other words the height.
   * It's update lifecycle with events are onSpringStart and onSpringCancel will give you the old value, while onSpringEnd will give you the current one.
   */
  height: number
}
