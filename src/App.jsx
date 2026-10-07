import { useLayoutEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import './App.css'
import AdminPanel from './components/AdminPanel.jsx'
import Nav from './components/Nav.jsx'
import Reveal from './components/Reveal.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'
import Hero from './components/Hero.jsx'
import Works from './components/Works.jsx'
import About from './components/About.jsx'
import Contact from './components/Contact.jsx'
import Footer from './components/Footer.jsx'
import { useAdminSession, useHashRoute } from './hooks.js'
import { isSupabaseConfigured } from './lib/supabase.js'
import { USE_MOCK_WORKS } from './lib/mockWorks.js'

const THEME_KEY = 'theme'

function getInitialDark() {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored === 'dark' || stored === 'light') {
      return stored === 'dark'
    }
  } catch {
    // Ignore unreadable storage and fall back to the system preference.
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function App() {
  const [isDark, setIsDark] = useState(getInitialDark)
  const route = useHashRoute()
  const { status, session, isAdmin } = useAdminSession()

  useLayoutEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', isDark)
    root.classList.toggle('light', !isDark)

    try {
      localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light')
    } catch {
      // Ignore storage failures; the toggle still works for this session.
    }
  }, [isDark])

  const isAdminRoute = route === 'admin'

  const toggleTheme = (event) => {
    const nextDark = !isDark
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!document.startViewTransition || reducedMotion) {
      setIsDark(nextDark)
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const originX = rect.left + rect.width / 2
    const originY = rect.top + rect.height / 2
    const radius = Math.hypot(
      Math.max(originX, window.innerWidth - originX),
      Math.max(originY, window.innerHeight - originY),
    )

    const transition = document.startViewTransition(() => {
      flushSync(() => setIsDark(nextDark))
    })

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${originX}px ${originY}px)`,
            `circle(${radius}px at ${originX}px ${originY}px)`,
          ],
        },
        {
          duration: 760,
          easing: 'cubic-bezier(.22,.61,.36,1)',
          pseudoElement: '::view-transition-new(root)',
        },
      )
    }).catch(() => {
      // The theme has already changed; only the decorative reveal was skipped.
    })
  }

  if (isAdminRoute) {
    return (
      <div className="page admin-route">
        <header className="admin-topbar shell">
          <a className="admin-brand" href="#/">
            Uali Damir
          </a>
          <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
        </header>
        <main>
          <h1 className="visually-hidden">Admin</h1>
          <AdminPanel status={status} session={session} isAdmin={isAdmin} />
          {(isAdmin || (USE_MOCK_WORKS && !isSupabaseConfigured)) && <Works isAdmin />}
        </main>
      </div>
    )
  }

  return (
    <div className="page">
      <Nav isDark={isDark} onToggleTheme={toggleTheme} />

      <main className="page-main">
        <Hero />
        <Reveal>
          <Works />
        </Reveal>
        <Reveal>
          <About />
        </Reveal>
        <Reveal>
          <Contact />
        </Reveal>
      </main>

      <Footer />
    </div>
  )
}

export default App
