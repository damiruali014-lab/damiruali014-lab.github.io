import { useRef } from 'react'
import './Reveal.css'
import { useRevealOnScroll } from '../hooks.js'

function Reveal({ children }) {
  const ref = useRef(null)
  const isRevealed = useRevealOnScroll(ref)

  return (
    <div ref={ref} className={`reveal${isRevealed ? ' is-visible' : ''}`}>
      {children}
    </div>
  )
}

export default Reveal
