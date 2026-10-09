import { useRef } from 'react'

// One card per work. A tablist: arrow keys move between channels and switch
// the stage immediately, Home/End jump to the ends.
function ChannelStrip({ works, selectedId, onSelect }) {
  const stripRef = useRef(null)

  function handleKeyDown(event) {
    const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }
    const current = works.findIndex((work) => work.id === selectedId)
    let next = null

    if (event.key in keys) next = (current + keys[event.key] + works.length) % works.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = works.length - 1
    if (next === null) return

    event.preventDefault()
    onSelect(works[next].id)
    stripRef.current?.querySelectorAll('[role="tab"]')[next]?.focus()
  }

  return (
    <div
      className="channel-strip"
      role="tablist"
      aria-label="Channels"
      aria-orientation="horizontal"
      ref={stripRef}
      onKeyDown={handleKeyDown}
    >
      {works.map((work, position) => {
        const active = work.id === selectedId
        return (
          <button
            key={work.id}
            id={`channel-${work.id}`}
            type="button"
            role="tab"
            className={`channel${active ? ' is-active' : ''}`}
            aria-selected={active}
            aria-controls="stage-panel"
            tabIndex={active ? 0 : -1}
            onClick={() => onSelect(work.id)}
          >
            <span className="channel-number">
              {active && <span className="channel-dot" aria-hidden="true" />}
              CH {String(position + 1).padStart(2, '0')}
            </span>
            <span className="channel-title">{work.title}</span>
            <span className="channel-category">{work.category}</span>
          </button>
        )
      })}
    </div>
  )
}

export default ChannelStrip
