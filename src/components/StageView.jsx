import { useEffect, useRef, useState } from 'react'
import StageScreen from './StageScreen.jsx'
import { useInViewport } from '../hooks.js'

// A frame that has not reported "load" in this long is treated as unusable.
const LOAD_TIMEOUT_MS = 8000

const VIEWS = [
  { id: 'desktop', label: 'Desktop' },
  { id: 'mobile', label: 'Mobile' },
]

// The frame plus the line under it. Rendered with key={work.id}, so its state
// (loading, fallback) starts fresh on every channel change.
function StageView({ work, embed, number, view, onViewChange, switched }) {
  const isEmbed = embed.kind === 'iframe'
  const [status, setStatus] = useState(isEmbed ? 'loading' : 'ready')
  const frameRef = useRef(null)
  const screenRef = useRef(null)
  // The frame is lazy: only count down once it is actually near the viewport.
  const inView = useInViewport(frameRef)
  const canFullscreen =
    !isEmbed && typeof document !== 'undefined' && document.fullscreenEnabled

  useEffect(() => {
    if (!isEmbed || status !== 'loading' || !inView) return
    const timer = window.setTimeout(() => setStatus('fallback'), LOAD_TIMEOUT_MS)
    return () => window.clearTimeout(timer)
  }, [isEmbed, status, inView])

  // Browsers fire "load" even for their own error page, so an unreachable
  // host looks like a loaded frame. A no-cors request cannot read headers
  // (so X-Frame-Options refusals still need the manual button) but it does
  // fail fast on DNS, connection and mixed-content errors.
  useEffect(() => {
    if (!isEmbed || !inView) return
    const controller = new AbortController()
    fetch(embed.src, { mode: 'no-cors', cache: 'no-store', signal: controller.signal }).catch(
      (error) => {
        if (error.name !== 'AbortError') setStatus('fallback')
      },
    )
    return () => controller.abort()
  }, [isEmbed, inView, embed.src])

  const showingFallback = isEmbed && status === 'fallback'

  return (
    <div className="stage-main">
      <div className={`stage-frame${isEmbed && !showingFallback ? ' is-embed' : ''}`} ref={frameRef}>
        <div className="stage-bar">
          <span className="stage-dot" aria-hidden="true" />
          <span className="stage-bar-text">
            LIVE · CH {number} · {work.title}
          </span>
          {/* Hidden on phones by CSS: there the site is already its mobile self. */}
          {isEmbed && !showingFallback && (
            <div className="stage-views" role="group" aria-label="Preview size">
              {VIEWS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  className={`stage-view${view === id ? ' is-active' : ''}`}
                  aria-pressed={view === id}
                  onClick={() => onViewChange(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div
          className={`stage-screen${isEmbed && !showingFallback && view === 'mobile' ? ' is-mobile' : ''}`}
          ref={screenRef}
        >
          <div className="stage-screen-inner">
            <StageScreen
              work={work}
              embed={embed}
              status={status}
              onFrameLoad={() => setStatus((s) => (s === 'loading' ? 'live' : s))}
            />
          </div>
          {isEmbed && status === 'loading' && (
            <p className="stage-loading" aria-live="polite">
              <span className="stage-loading-dot" aria-hidden="true" />
              Loading live demo…
            </p>
          )}
          {showingFallback && embed.destination && (
            <a
              className="stage-fallback-open"
              href={embed.destination}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open live site ↗
              <span className="visually-hidden"> (opens in a new tab)</span>
            </a>
          )}
          {switched && <span className="stage-static" aria-hidden="true" />}
        </div>
      </div>

      <div className="stage-foot">
        <p className="stage-hint">
          {showingFallback
            ? 'Showing screenshots instead of the live demo.'
            : work.tryHint && (
                <>
                  <span className="stage-hint-key">Try it:</span> {work.tryHint}
                </>
              )}
        </p>

        <div className="stage-actions">
          {isEmbed && !showingFallback && (
            <button
              type="button"
              className="stage-link"
              onClick={() => setStatus('fallback')}
            >
              Show preview instead
            </button>
          )}
          {showingFallback && (
            <button
              type="button"
              className="stage-link"
              onClick={() => setStatus('loading')}
            >
              Back to live demo
            </button>
          )}
          {isEmbed && embed.destination && (
            <a
              className="stage-link"
              href={embed.destination}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open full screen ↗
              <span className="visually-hidden"> (opens in a new tab)</span>
            </a>
          )}
          {/* Image-only projects still link out to the real site, in a new tab. */}
          {!isEmbed && embed.destination && (
            <a
              className="stage-link"
              href={embed.destination}
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit site ↗
              <span className="visually-hidden"> (opens in a new tab)</span>
            </a>
          )}
          {canFullscreen && (
            <button
              type="button"
              className="stage-link"
              onClick={() => screenRef.current?.requestFullscreen?.()}
            >
              Open full screen ↗
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default StageView
