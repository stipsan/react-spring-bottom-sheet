import cx from 'classnames'
import { forwardRef, useEffect, useRef, useState } from 'react'
import { animated, config, useSpring } from 'react-spring'
import styles from './Hero.module.css'

const subtitle = 'Accessible, Delightful, and Performant'

const Link: React.FC<{
  children: React.ReactNode
  href?: string
  target?: string
  className?: string
}> = forwardRef(
  ({ children, className, ...props }, ref: React.Ref<HTMLAnchorElement>) => (
    <a
      {...props}
      className={cx(
        'bg-hero whitespace-nowrap rounded-full px-4 py-2 mr-2 text-xl hover:text-hero focus:outline-none focus-visible:text-hero focus-visible:ring-2 focus-visible:ring-hero transition-colors duration-150 focus-visible:duration-0',
        className
      )}
      ref={ref}
    >
      {children}
    </a>
  )
)

const Links = ({ className }: { className?: string }) => (
  <>
    <Link
      className={className}
      href="https://github.com/NIPE-Solutions/react-spring-bottom-sheet/blob/main/GET_STARTED.md#get-started"
    >
      Get started
    </Link>
    <Link
      className={className}
      href="https://github.com/NIPE-Solutions/react-spring-bottom-sheet"
    >
      GitHub
    </Link>
  </>
)
// The wrapping in <g> is because of Safari 🙄 https://bug-149617-attachments.webkit.org/attachment.cgi?id=262048
const SvgText: React.FC<{ children: React.ReactNode, x?: string; y?: string; className?: string }> = ({
  children,
  className,
  x = '23',
  y,
  ...props
}) => (
  <g
    {...props}
    className={cx(className, styles.text, 'transform-gpu duration-0 opacity-0')}
  >
    <text
      x={x}
      y={y}
      className="text-hero fill-current font-display font-black select-none pointer-events-none"
    >
      {children}
    </text>
  </g>
)

let immediate = false
export default function Hero({ className }: { className?: string }) {
  // @TODO this whole monster needs a total rewrite O_O"
  const [mounted, setMounted] = useState(false)
  const skip = !mounted && immediate ? true : false
  const [open, setOpen] = useState(true)
  const openClassRef = useRef(false)
  const classNameRef = useRef(null)
  const { y, state } = useSpring<any>({
    config: config.stiff,
    immediate: skip,
    from: { y: '208px', state: 0 },
    to: {
      y: open ? '0px' : '208px',
      state: open ? 1 : 0,
    },
    onFrame: ({ state }) => {
      if (state > 0) {
        if (!openClassRef.current) {
          classNameRef.current.classList.add(
            styles.open,
            skip ? styles.skip : undefined
          )
          openClassRef.current = true
        }
      } else {
        if (openClassRef.current) {
          classNameRef.current.classList.remove(styles.open, styles.skip)
          openClassRef.current = false
        }
      }
    },
    onRest: () => {
      if (mounted) {
        immediate = true
      }
    },
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <>
      <div className={cx(styles.wrapper, 'flex justify-center', className)}>
        <div className="inline-flex items-end">
          <svg
            onPointerDown={() => setOpen((open) => !open)}
            className={cx(styles.svg, 'flex-shrink-0')}
            width="200"
            height="286"
            viewBox="0 0 200 286"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Phone illustration of a bottom sheet containing the text: React Spring Bottom Sheet"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M33.1779 0C10.0158 0 3.8147e-05 10.4712 3.8147e-05 33.4574V377.457C3.8147e-05 400.443 10.0158 410.496 33.1779 410.496H166.41C188.769 410.496 200 399.634 200 377.457C200 377.457 200 56.4435 200 33.4574C200 10.4712 189.34 0 166.178 0H33.1779Z"
              fill="#592340"
            />
            <animated.path
              style={{
                fill: state.interpolate({ output: ['#fed7e6', '#FC9EC2'] }),
              }}
              fillRule="evenodd"
              clipRule="evenodd"
              d="M49 13.5C49.5 18 52.6325 23 60.5 23H139C146.868 23 149.5 18 150 13.5C150.282 10.9661 151.291 9 155 9L169.527 9.08597C182.598 9.08597 191 16.9649 191 30V379.5C191 392.535 182.598 400.468 169.527 400.468H30.0545C16.9836 400.468 9 392.585 9 379.55V30C9 16.9649 16.929 9 30 9H45C48.7085 9 48.7791 11.5122 49 13.5Z"
              fill="#fed7e6"
            />
            <animated.g
              ref={classNameRef}
              className="transform-gpu origin-center"
              style={{
                ['--tw-translate-y' as any]: y,
                /*
                ['--tw-scale-x' as any]: state.interpolate({
                  output: [0.9, 1],
                }),
                ['--tw-scale-y' as any]: state.interpolate({
                  output: [0.9, 1],
                }),
                // */
              }}
            >
              <path
                d="M9 99.75C9 93.4642 9 90.3213 9.92713 87.8082C11.4459 83.6913 14.6913 80.4459 18.8082 78.9271C21.3213 78 24.4642 78 30.75 78H169.25C175.536 78 178.679 78 181.192 78.9271C185.309 80.4459 188.554 83.6913 190.073 87.8082C191 90.3213 191 93.4642 191 99.75V372C191 380.381 191 384.572 189.764 387.922C187.739 393.412 183.412 397.739 177.922 399.764C174.572 401 170.381 401 162 401H38C29.619 401 25.4285 401 22.0777 399.764C16.5884 397.739 12.2613 393.412 10.2362 387.922C9 384.572 9 380.381 9 372V99.75Z"
                fill="white"
              />
              <rect
                x="89"
                y="85"
                width="22"
                height="2"
                rx="1"
                fill="hsl(328deg 44% 24% / 50%)"
              />
              <SvgText y="128">React</SvgText>
              <SvgText y="174">Spring</SvgText>
              <SvgText y="220">Bottom</SvgText>
              <SvgText y="266">Sheet</SvgText>
            </animated.g>
          </svg>
          <div className="font-display ml-10 mb-10 text-hero hidden md:block">
            <h1 className={cx(styles.subtitle, 'pb-4 max-w-sm')}>{subtitle}</h1>
            <div className="mt-4">
              <Links className="text-hero-lighter hover:bg-hero-lighter focus:bg-hero-lighter" />
            </div>
          </div>
        </div>
      </div>
      <div className="md:hidden font-display text-hero px-8 py-4">
        <h1 className={cx(styles.subtitle, 'pb-4')}>{subtitle}</h1>
        <div className="mt-4">
          <Links className="text-white hover:bg-white focus:bg-white" />
        </div>
      </div>
    </>
  )
}
