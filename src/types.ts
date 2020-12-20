export type SnapPointProps = {
  /** The height of the sticky footer, if there's one */
  headerHeight: number
  /** The height of the sticky footer, if there's one */
  footerHeight: number
  /** If the bottom sheet is animating to a snap point the height will match the destination height, not the height the bottom sheet might have in the middle of the animation. It includes the header and footer heights. */
  height: number
  /** Minimum height needed to avoid scroll overflow in the content area, if possible. */
  minHeight: number
  /** Max height the sheet can be, your snap points are capped to this value. It's window.innerHeight by default but can be overriden using the maxHeight prop. */
  maxHeight: number
}

export type snapPoints = (props: SnapPointProps) => number[] | number

export type defaultSnapProps = {
  /** The snap points currently in use, this can be controlled by providing a `snapPoints` function on the bottom sheet. */
  snapPoints: number[]
  /** The last snap point the user dragged to, if any. 0 if the user haven't interacted */
  lastSnap: number | null
} & SnapPointProps

type defaultSnap = (props: defaultSnapProps) => number

/* Might make sense to expose a preventDefault method here */
export type SpringEvent = {
  type: 'OPEN' | 'CLOSE' | 'RESIZE' | 'SNAP' | 'DRAG'
}

export type Props = {
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
   */
  header?: React.ReactNode | false

  /** A reference to the element that should be focused. By default it'll be the first interactive element. */
  initialFocusRef?: React.RefObject<HTMLElement>

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

  /** Handler that is called to get the height values that the bottom sheet can *snap* to when the user stops dragging. */
  snapPoints?: snapPoints

  /** Handler that is called to get the initial height of the bottom sheet when it's opened (or when the viewport is resized). */
  defaultSnap?: defaultSnap | number

  /* Configures body-scroll-lock to reserve scrollbar gap by setting padding on <body>, clears when closing the bottom sheet. on by default iff blocking=true  */
  reserveScrollBarGap?: boolean
} & Omit<React.PropsWithoutRef<JSX.IntrinsicElements['div']>, 'children'>

export interface RefHandles {
  /**
   * When given a number it'll find the closest snap point, so you don't need to know the exact value,
   * Use the callback method to access what snap points you can choose from.
   *
   */
  snapTo: (
    numberOrCallback: number | ((state: defaultSnapProps) => number)
  ) => void
}
