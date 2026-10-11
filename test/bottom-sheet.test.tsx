import { StrictMode, useRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import { BottomSheet } from '../src'
import type { BottomSheetRef } from '../src'

const content = <div style={{ height: 200 }}>sheet content</div>

const sheetRoot = () => document.querySelector('[data-rsbs-root]')
const sheetState = () => sheetRoot()?.getAttribute('data-rsbs-state')

describe('BottomSheet', () => {
  it('renders nothing while closed', () => {
    render(<BottomSheet open={false}>{content}</BottomSheet>)
    expect(sheetRoot()).toBeNull()
  })

  it('stays mounted but hidden when keepMounted is set', async () => {
    render(
      <BottomSheet open={false} keepMounted>
        {content}
      </BottomSheet>
    )
    await waitFor(() => expect(sheetRoot()).not.toBeNull())
    expect(sheetState()).toBe('closed')
  })

  it('opens and exposes the state as a data attribute', async () => {
    render(<BottomSheet open>{content}</BottomSheet>)

    await waitFor(() => expect(sheetState()).toBe('open'), { timeout: 4000 })
    expect(screen.getByText('sheet content')).toBeTruthy()
    expect(
      document.querySelector('[data-rsbs-overlay]')?.getAttribute('role')
    ).toBe('dialog')
  })

  // The sheet mounts twice under StrictMode; react-spring v8 left the springs dead after that
  it('still opens under StrictMode', async () => {
    render(
      <StrictMode>
        <BottomSheet open>{content}</BottomSheet>
      </StrictMode>
    )

    await waitFor(() => expect(sheetState()).toBe('open'), { timeout: 4000 })
  })

  it('sets aria-modal from the blocking prop', async () => {
    render(
      <BottomSheet open blocking={false}>
        {content}
      </BottomSheet>
    )

    await waitFor(() => expect(sheetState()).toBe('open'), { timeout: 4000 })
    expect(
      document.querySelector('[data-rsbs-overlay]')?.getAttribute('aria-modal')
    ).toBe('false')
    expect(document.querySelector('[data-rsbs-backdrop]')).toBeNull()
  })

  it('dismisses on Escape', async () => {
    const onDismiss = vi.fn()
    render(
      <BottomSheet open onDismiss={onDismiss}>
        {content}
      </BottomSheet>
    )

    await waitFor(() => expect(sheetState()).toBe('open'), { timeout: 4000 })

    const overlay = document.querySelector('[data-rsbs-overlay]')!
    act(() => {
      overlay.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
      )
    })

    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('dismisses once per backdrop tap', async () => {
    const onDismiss = vi.fn()
    render(
      <BottomSheet open onDismiss={onDismiss}>
        {content}
      </BottomSheet>
    )
    await waitFor(() => expect(sheetState()).toBe('open'), { timeout: 4000 })

    const backdrop = document.querySelector('[data-rsbs-backdrop]')!
    const pointer = { pointerId: 1, buttons: 1, clientX: 10, clientY: 10 }
    fireEvent.pointerDown(backdrop, pointer)
    fireEvent.pointerUp(backdrop, { ...pointer, buttons: 0 })

    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('dismisses once per swipe down', async () => {
    const onDismiss = vi.fn()
    render(
      <BottomSheet open onDismiss={onDismiss} header={<div>header</div>}>
        {content}
      </BottomSheet>
    )
    await waitFor(() => expect(sheetState()).toBe('open'), { timeout: 4000 })

    const header = document.querySelector('[data-rsbs-header]')!
    const pointer = { pointerId: 1, buttons: 1, clientX: 10 }
    fireEvent.pointerDown(header, { ...pointer, clientY: 0 })
    fireEvent.pointerMove(header, { ...pointer, clientY: 150 })
    fireEvent.pointerMove(header, { ...pointer, clientY: 400 })
    fireEvent.pointerUp(header, { ...pointer, buttons: 0, clientY: 400 })

    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('reports the current height through the ref', async () => {
    let sheetRef: React.RefObject<BottomSheetRef | null>

    function Wrapper() {
      sheetRef = useRef<BottomSheetRef>(null)
      return (
        <BottomSheet open ref={sheetRef}>
          {content}
        </BottomSheet>
      )
    }

    render(<Wrapper />)
    await waitFor(() => expect(sheetState()).toBe('open'), { timeout: 4000 })
    expect(sheetRef!.current?.height).toBeGreaterThan(0)
    expect(sheetRef!.current?.scrollElement).not.toBeNull()
  })

  it('unmounts after closing', async () => {
    const { rerender } = render(<BottomSheet open>{content}</BottomSheet>)
    await waitFor(() => expect(sheetState()).toBe('open'), { timeout: 4000 })

    rerender(<BottomSheet open={false}>{content}</BottomSheet>)
    await waitFor(() => expect(sheetRoot()).toBeNull(), { timeout: 4000 })
    expect(document.body.style.overflow).not.toBe('hidden')
  })
})
