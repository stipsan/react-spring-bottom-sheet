import { useLayoutEffect } from './useLayoutEffect'
import type { ModeEvent } from '../machines/mode'

export function useHeaderHeight(
  ref: React.RefObject<Element | null | undefined> | undefined,
  send: (event: ModeEvent) => void
) {
  useLayoutEffect(() => {
    if (ref?.current) {
      send({ type: 'OBSERVE_HEADER_HEIGHT' })
      return () => {
        send({ type: 'DISCONNECT_HEADER_HEIGHT' })
      }
    }
  }, [ref, send])
}

export function useContentHeight(
  ref: React.RefObject<Element> | undefined,
  send: (event: ModeEvent) => void
) {
  useLayoutEffect(() => {
    if (ref?.current) {
      send({ type: 'OBSERVE_CONTENT_HEIGHT' })
      return () => {
        send({ type: 'DISCONNECT_CONTENT_HEIGHT' })
      }
    }
  }, [ref, send])
}

export function useFooterHeight(
  ref: React.RefObject<Element> | undefined,
  send: (event: ModeEvent) => void
) {
  useLayoutEffect(() => {
    if (ref?.current) {
      send({ type: 'OBSERVE_FOOTER_HEIGHT' })
      return () => {
        send({ type: 'DISCONNECT_FOOTER_HEIGHT' })
      }
    }
  }, [ref, send])
}
