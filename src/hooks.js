import { useEffect, useState } from 'react'
import { checkIsAdmin, getSession, onAuthChange } from './lib/auth.js'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

export function usePrefersReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
  )

  useEffect(() => {
    const query = window.matchMedia(REDUCED_MOTION_QUERY)
    const handleChange = (event) => setPrefersReduced(event.matches)

    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [])

  return prefersReduced
}

// Keeps offscreen carousels from animating. Starts false so nothing runs
// until the observer has reported, and disconnects on unmount.
export function useInViewport(ref) {
  // Without IntersectionObserver support, treat everything as visible.
  const [inViewport, setInViewport] = useState(
    () => typeof IntersectionObserver === 'undefined',
  )

  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      ([entry]) => setInViewport(entry.isIntersecting),
      { rootMargin: '100px', threshold: 0.2 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [ref])

  return inViewport
}

// Reveals a node the first time it scrolls into view, then stops observing.
// Deliberately one-way: sections do not re-animate on the way back up.
export function useRevealOnScroll(ref) {
  const [isRevealed, setIsRevealed] = useState(
    () => typeof IntersectionObserver === 'undefined',
  )

  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [ref])

  return isRevealed
}

// Resolves the Supabase session and whether that user is on the admin
// allow-list. Re-runs on sign-in, sign-out and token expiry.
export function useAdminSession() {
  const [state, setState] = useState({
    status: 'loading',
    session: null,
    isAdmin: false,
  })

  useEffect(() => {
    let active = true

    async function resolve(session) {
      const isAdmin = await checkIsAdmin(session)
      if (active) setState({ status: 'ready', session, isAdmin })
    }

    getSession().then(resolve)
    const unsubscribe = onAuthChange(resolve)

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  return state
}

// Minimal hash routing: '#/admin' opens the admin panel, anything else is the
// public site. Avoids pulling in a router for a single private route.
export function useHashRoute() {
  const [route, setRoute] = useState(() =>
    window.location.hash.replace(/^#\/?/, ''),
  )

  useEffect(() => {
    const onHashChange = () =>
      setRoute(window.location.hash.replace(/^#\/?/, ''))

    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return route
}
