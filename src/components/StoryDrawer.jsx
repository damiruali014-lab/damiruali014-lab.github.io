import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './StoryDrawer.css'
import { STEP_TYPES } from '../lib/story.js'

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'

const typeLabel = (value) => STEP_TYPES.find((type) => type.value === value)?.label ?? value

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

/**
 * "How I built it": a timeline from the first prompt to the shipped product.
 * A side drawer on desktop, a full page below 768px. `story` must already be
 * public-only (see publicStory); this component never filters.
 */
function StoryDrawer({ title, story, onClose }) {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const dialogRef = useRef(null)
  const tabsRef = useRef(null)
  const touchStart = useRef(null)

  const { steps, stats, lesson } = story
  const count = steps.length
  const step = steps[index]
  const statLine = [
    stats.prompts && `${stats.prompts} prompts`,
    stats.days && `${stats.days} days`,
    stats.commits && `${stats.commits} commits`,
  ].filter(Boolean)

  // Modal behaviour: the page behind is inert and cannot scroll; focus goes
  // into the dialog and returns to what opened it.
  useEffect(() => {
    const root = document.getElementById('root')
    const opener = document.activeElement
    const previousOverflow = document.body.style.overflow

    root?.setAttribute('inert', '')
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()

    return () => {
      root?.removeAttribute('inert')
      document.body.style.overflow = previousOverflow
      opener?.focus?.()
    }
  }, [])

  // Keep the current step visible in a long, horizontally scrolling timeline.
  useEffect(() => {
    const tabs = tabsRef.current?.querySelectorAll('[role="tab"]')
    tabs?.[index]?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [index])

  function go(next, { focusTab = false } = {}) {
    const target = Math.max(0, Math.min(count - 1, next))
    if (target === index) return
    setDirection(target > index ? 1 : -1)
    setIndex(target)
    if (focusTab) tabsRef.current?.querySelectorAll('[role="tab"]')[target]?.focus()
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }

    if (event.key === 'Tab') {
      const items = [...dialogRef.current.querySelectorAll(FOCUSABLE)]
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (event.shiftKey && (active === first || active === dialogRef.current)) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first?.focus()
      }
      return
    }

    const onTab = event.target.closest?.('[role="tab"]')
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      go(index + 1, { focusTab: Boolean(onTab) })
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      go(index - 1, { focusTab: Boolean(onTab) })
    } else if (onTab && event.key === 'Home') {
      event.preventDefault()
      go(0, { focusTab: true })
    } else if (onTab && event.key === 'End') {
      event.preventDefault()
      go(count - 1, { focusTab: true })
    }
  }

  function handleTouchStart(event) {
    const touch = event.touches[0]
    touchStart.current = { x: touch.clientX, y: touch.clientY }
  }

  function handleTouchEnd(event) {
    const start = touchStart.current
    touchStart.current = null
    if (!start) return
    const touch = event.changedTouches[0]
    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y
    // A deliberate, mostly horizontal swipe; vertical drags are scrolling.
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(index + (dx < 0 ? 1 : -1))
  }

  return createPortal(
    <div className="story-root" onKeyDown={handleKeyDown}>
      <div className="story-scrim" onClick={onClose} aria-hidden="true" />

      <div
        className="story-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="story-title"
        tabIndex={-1}
        ref={dialogRef}
      >
        <header className="story-head">
          <div className="story-head-text">
            <h2 className="story-title" id="story-title">
              How I built it
            </h2>
            <p className="story-subtitle">{title}</p>
          </div>
          <button type="button" className="story-close" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </header>

        <div className="story-timeline" role="tablist" aria-label="Build steps" ref={tabsRef}>
          {steps.map((item, position) => (
            <button
              key={position}
              id={`story-tab-${position}`}
              type="button"
              role="tab"
              className={`story-node${position === index ? ' is-current' : ''}${position < index ? ' is-past' : ''}`}
              aria-selected={position === index}
              aria-controls="story-panel"
              tabIndex={position === index ? 0 : -1}
              onClick={() => go(position)}
            >
              <span className="story-node-dot">{position + 1}</span>
              <span className="story-node-label">{typeLabel(item.type)}</span>
            </button>
          ))}
        </div>

        <div
          className="story-body"
          id="story-panel"
          role="tabpanel"
          aria-labelledby={`story-tab-${index}`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <article className={`story-card ${direction > 0 ? 'from-right' : 'from-left'}`} key={index}>
            <p className="story-card-meta">
              <span className="story-chip">{typeLabel(step.type)}</span>
              {step.date && <time dateTime={step.date}>{formatDate(step.date)}</time>}
            </p>
            {step.title && <h3 className="story-card-title">{step.title}</h3>}
            {step.text && <p className="story-card-text">{step.text}</p>}
            {step.prompt && (
              <div className="story-prompt">
                <p className="story-prompt-label">&gt; prompt to Claude Code</p>
                <pre className="story-prompt-text">{step.prompt}</pre>
              </div>
            )}
            {step.imageUrl && (
              <img
                className="story-card-image"
                src={step.imageUrl}
                alt={step.title || `Step ${index + 1}`}
                loading="lazy"
              />
            )}
          </article>
        </div>

        <footer className="story-foot">
          {(statLine.length > 0 || lesson) && (
            <div className="story-summary">
              {statLine.length > 0 && <p className="story-stats">{statLine.join(' · ')}</p>}
              {lesson && (
                <p className="story-lesson">
                  <span className="story-lesson-key">What I learned:</span> {lesson}
                </p>
              )}
            </div>
          )}
          <div className="story-pager">
            <button
              type="button"
              className="story-pager-button"
              disabled={index === 0}
              onClick={() => go(index - 1)}
            >
              ← Previous
            </button>
            <span className="story-pager-count" aria-live="polite">
              {index + 1} / {count}
            </span>
            <button
              type="button"
              className="story-pager-button"
              disabled={index === count - 1}
              onClick={() => go(index + 1)}
            >
              Next →
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  )
}

export default StoryDrawer
