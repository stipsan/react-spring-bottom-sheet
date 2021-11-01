import { useState } from 'react'

import useRootStateMachine from '../../src/hooks/useMachine'

export default () => {
  const [toggle, setToggle] = useState(false)
  useRootStateMachine()

  return <h1>Hello world</h1>
}
