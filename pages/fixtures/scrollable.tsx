import Code from '../../docs/fixtures/Code'
import Container from '../../docs/fixtures/Container'
import SheetContent from '../../docs/fixtures/SheetContent'
import SnapMarker from '../../docs/fixtures/SnapMarker'
import { BottomSheet } from '../../src'

export default function ScrollableFixturePage() {
  return (
    <Container>
      <SnapMarker
        className="text-white text-opacity-50"
        style={{ top: '10vh' }}
      />
      <SnapMarker style={{ top: '10vh', ['--size' as any]: '0.5vh' }} />
      <SnapMarker
        className="text-white text-opacity-50"
        style={{ top: '40vh' }}
      />
      <SnapMarker style={{ top: '40vh', ['--size' as any]: '0.5vh' }} />
      <SnapMarker
        className="text-white text-opacity-50"
        style={{ top: '75vh' }}
      />
      <SnapMarker style={{ top: '75vh', ['--size' as any]: '0.5vh' }} />
      <BottomSheet
        isOpen
        initialHeight={({ snapPoints: [, _] }) => _}
        snapPoints={({ viewportHeight }) => [
          viewportHeight - viewportHeight / 10,
          viewportHeight * 0.6,
          viewportHeight / 4,
        ]}
      >
        <SheetContent>
          <p>
            The sheet will always try to set initial focus on the first
            interactive element it finds.
          </p>
          <p>If none is found it sets keyboard focus to the container.</p>
          <p>
            You can override this with <Code>initialFocusRef</Code>.
          </p>
        </SheetContent>
      </BottomSheet>
    </Container>
  )
}
