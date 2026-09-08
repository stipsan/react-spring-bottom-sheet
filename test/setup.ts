import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// happy-dom ships neither of these, and the sheet cannot measure itself without them
class ResizeObserverMock {
  private callback: ResizeObserverCallback
  private targets = new Set<Element>()

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
    observers.add(this)
  }

  observe(target: Element) {
    this.targets.add(target)
    this.emit()
  }

  unobserve(target: Element) {
    this.targets.delete(target)
  }

  disconnect() {
    this.targets.clear()
    observers.delete(this)
  }

  emit() {
    const entries = [...this.targets].map((target) => ({
      target,
      borderBoxSize: [{ blockSize: measuredHeight(target), inlineSize: 0 }],
      contentBoxSize: [{ blockSize: measuredHeight(target), inlineSize: 0 }],
      contentRect: { height: measuredHeight(target) } as DOMRectReadOnly,
      devicePixelContentBoxSize: [],
    })) as unknown as ResizeObserverEntry[]

    if (entries.length) {
      this.callback(entries, this as unknown as ResizeObserver)
    }
  }
}

const observers = new Set<ResizeObserverMock>()

/** Heights the mock reports, keyed by the data attribute on the element */
const heights: Record<string, number> = {
  'data-rsbs-content': 200,
  'data-rsbs-header': 50,
  'data-rsbs-footer': 40,
}

function measuredHeight(target: Element) {
  for (const [attr, height] of Object.entries(heights)) {
    if (target.hasAttribute(attr)) return height
  }
  return 0
}

/** Re-runs every observer, e.g. after content is added */
export function flushResizeObservers() {
  observers.forEach((observer) => observer.emit())
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock)

vi.stubGlobal(
  'matchMedia',
  vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
)

afterEach(() => {
  cleanup()
  observers.clear()
})
