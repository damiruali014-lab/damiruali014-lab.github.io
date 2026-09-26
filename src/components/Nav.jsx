import { useEffect, useRef, useState } from 'react'
import './Nav.css'
import ThemeToggle from './ThemeToggle.jsx'

const sections = [
  { id: 'work', label: 'Work' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
]

function Nav({ isDark, onToggleTheme }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  // Close the mobile menu on Escape or on a click outside it.
  useEffect(() => {
    if (!isOpen) return

    function onKeyDown(event) {
      if (event.key === 'Escape') setIsOpen(false)
    }
    function onPointerDown(event) {
      if (!menuRef.current?.contains(event.target)) setIsOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [isOpen])

  // Scroll without writing to location.hash, which the admin route reads.
  function handleJump(event, id) {
    const target = document.getElementById(id)
    if (!target) return

    event.preventDefault()
    setIsOpen(false)

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      block: 'start',
    })
    // Move keyboard focus with the viewport.
    target.setAttribute('tabindex', '-1')
    target.focus({ preventScroll: true })
  }

  return (
    <header className="nav" ref={menuRef}>
      <div className="nav-inner shell">
        <a className="nav-brand" href="#top" onClick={(e) => handleJump(e, 'top')}>
          Uali Damir
        </a>

        <p className="nav-status">
          <span className="nav-status-dot" aria-hidden="true" />
          Available for work
        </p>

        <nav className="nav-links" aria-label="Sections">
          {sections.map(({ id, label }) => (
            <a
              key={id}
              className="nav-link"
              href={`#${id}`}
              onClick={(event) => handleJump(event, id)}
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="nav-actions">
          <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
          <button
            type="button"
            className="nav-menu-button"
            aria-expanded={isOpen}
            aria-controls="nav-mobile-menu"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setIsOpen((open) => !open)}
          >
            <span className="nav-menu-bar" aria-hidden="true" />
            <span className="nav-menu-bar" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        id="nav-mobile-menu"
        className={`nav-mobile${isOpen ? ' is-open' : ''}`}
        hidden={!isOpen}
      >
        <nav className="nav-mobile-links" aria-label="Sections">
          {sections.map(({ id, label }) => (
            <a
              key={id}
              className="nav-mobile-link"
              href={`#${id}`}
              onClick={(event) => handleJump(event, id)}
            >
              {label}
            </a>
          ))}
        </nav>
        <p className="nav-status is-mobile">
          <span className="nav-status-dot" aria-hidden="true" />
          Available for work
        </p>
      </div>
    </header>
  )
}

export default Nav
