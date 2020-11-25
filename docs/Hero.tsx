import cx from 'classnames'
import NextLink from 'next/link'
import { forwardRef, useEffect, useRef, useState } from 'react'
import {
  animated,
  config,
  useChain,
  useSpring,
  useTransition,
} from 'react-spring'
import styles from './Hero.module.css'

const subtitle = 'Accessible, Delightful, and Performant'

const Link: React.FC<{ href?: string; target?: string }> = forwardRef(
  ({ children, href }, ref: React.Ref<HTMLAnchorElement>) => (
    <a
      className="bg-hero rounded-full px-4 py-2 text-hero-lighter mr-2 text-xl hover:text-hero hover:bg-hero-lighter focus:outline-none focus:bg-hero-lighter focus:text-hero focus:ring-2 focus:ring-hero transition-colors duration-150 focus:duration-0"
      href={href}
      ref={ref}
    >
      {children}
    </a>
  )
)

const Links = () => (
  <>
    <NextLink href="/docs" passHref>
      <Link>Get Started</Link>
    </NextLink>
    <Link
      href="https://github.com/stipsan/react-spring-bottom-sheet"
      target="_blank"
    >
      GitHub
    </Link>
  </>
)
const SvgText: React.FC<{ x?: string; y?: string; className?: string }> = ({
  children,
  className,
  x = '23',
  y,
  ...props
}) => (
  <text
    x={x}
    y={y}
    {...props}
    className={cx(
      className,
      styles.text,
      'text-hero fill-current font-display font-black transform-gpu transition-all select-none'
    )}
  >
    {children}
  </text>
)

export default function Hero() {
  const [open, setOpen] = useState(false)
  const [animating, setAnimating] = useState(false)
  const { transform, opacity } = useSpring<any>({
    config: config.stiff,
    from: { transform: 'translate3d(0,208px,0)', opacity: 0 },
    to: {
      transform: open ? 'translate3d(0,0,0)' : 'translate3d(0,208px,0)',
      opacity: open ? 1 : 0,
    },
    onStart: () => {
      console.count('onStart')
      setAnimating(true)
    },
    onRest: () => {
      console.count('onRest')
      setAnimating(false)
    },
  })

  useEffect(() => {
    setOpen(true)
  }, [])

  return (
    <>
      <div className={cx(styles.wrapper, 'flex justify-center')}>
        <div className="inline-flex items-end">
          <svg
            onPointerDown={() => setOpen((open) => !open)}
            className={cx(styles.svg, 'flex-shrink-0 transform-gpu')}
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
              d="M33.3585 0.251801C10.1965 0.251801 -0.231995 10.723 -0.231995 33.7092V377.291C-0.231995 400.277 10.1965 410.748 33.3585 410.748H166.59C188.949 410.748 200.181 399.467 200.181 377.291V33.7092C200.181 10.723 189.752 0.251801 166.59 0.251801H33.3585Z"
              fill="#592340"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M49.2421 13.2667C49.2421 17.8967 52.6614 23.5577 60.5289 23.5577H138.892C146.759 23.5577 150.179 17.8967 150.179 13.4275C150.179 11.1996 150.179 9.08594 153.887 9.08594H169.527C182.598 9.08594 190.489 16.9546 190.489 29.9897V379.564C190.489 392.599 182.598 400.468 169.527 400.468H30.0545C16.9836 400.468 9.09331 392.599 9.09331 379.564V29.9897C9.09331 16.9546 16.9836 9.08594 30.0545 9.08594H45.5336C49.2421 9.08594 49.2421 11.1996 49.2421 13.2667Z"
              fill="#fed7e6"
            />
            <animated.path
              style={{ opacity }}
              fillRule="evenodd"
              clipRule="evenodd"
              d="M49.2421 13.2667C49.2421 17.8967 52.6614 23.5577 60.5289 23.5577H138.892C146.759 23.5577 150.179 17.8967 150.179 13.4275C150.179 11.1996 150.179 9.08594 153.887 9.08594H169.527C182.598 9.08594 190.489 16.9546 190.489 29.9897V379.564C190.489 392.599 182.598 400.468 169.527 400.468H30.0545C16.9836 400.468 9.09331 392.599 9.09331 379.564V29.9897C9.09331 16.9546 16.9836 9.08594 30.0545 9.08594H45.5336C49.2421 9.08594 49.2421 11.1996 49.2421 13.2667Z"
              fill="#FC9EC2"
            />
            <animated.g
              style={{
                transform,
                ['--test' as any]: opacity.interpolate({
                  range: [0, 1],
                  output: [0, 1],
                  extrapolate: 'clamp',
                  map: Math.ceil,
                }),
              }}
              className={cx({ [styles.open]: open || animating })}
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
              <SvgText y="128">
                React {open && 'open'} {animating && 'animating'}
              </SvgText>
              <SvgText y="174">Spring</SvgText>
              <SvgText y="220">Bottom</SvgText>
              <SvgText y="266">Sheet</SvgText>
            </animated.g>
          </svg>
          <div className="font-display ml-10 mb-10 text-hero hidden md:block">
            <p
              className={cx(styles.subtitle, 'pb-4')}
              style={{ maxWidth: '500px' }}
            >
              {subtitle}
            </p>
            <div className="mt-4">
              <Links />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
