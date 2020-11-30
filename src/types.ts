export type SnapPointArg = {
  /** If the bottom sheet is animating to a snap point the currentHeight will be the destination height, not the height the bottom sheet might have in the middle of the animation. */
  currentHeight: number
  /** The lowest height the bottom sheet can be before it's unusable/unreachable. Things like device type and display cutouts is considered. */
  minHeight: number
  /** How tall the sheet can be based on the content heights. Viewport height also affects this number. */
  maxHeight: number
  /** Use this instead of reading from window.innerHeight yourself, this helps prevent unnecessary reflows. */
  viewportHeight: number
}

export type snapPoints = ({
  currentHeight,
  minHeight,
  maxHeight,
  viewportHeight,
}: SnapPointArg) => number[]

type initialHeightArg = {
  snapPoints: number[]
} & SnapPointArg

export type initialHeight = ({
  minHeight,
  maxHeight,
  viewportHeight,
  snapPoints,
}: initialHeightArg) => number

export type SharedProps = {
  children: React.ReactNode

  /**
   * Additional CSS class for the container.
   */
  className?: string

  /**
   * Renders a sticky footer at the bottom of the sheet.
   */
  footer?: React.ReactNode

  /**
   * Renders below the drag handle, most often a `<BottomSheetToolbar />`
   */
  header?: React.ReactNode

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
   * Ensures that drag interactions works properly on iOS and Android.
   * If setting this to `false`make sure you test on real iOS and Android devices to ensure the dragging interactions don't break.
   * @default true
   */
  scrollLocking?: boolean

  /** The max width. */
  maxWidth?: string

  /** Left side margin. */
  marginLeft?: string

  /** Right side margin. */
  marginRight?: string

  /** The background color. */
  backgroundColor?: string
}

type heightSetter = (state: initialHeightArg) => number
export type setHeight = (height: number | heightSetter) => void
