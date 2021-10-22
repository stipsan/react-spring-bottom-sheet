import { useState } from 'react'

import useRootStateMachine from '../../src/hooks/useRootStateMachine'

export default () => {
  const [toggle, setToggle] = useState(false)
  useRootStateMachine()

  return <h1>Hello world</h1>
}
