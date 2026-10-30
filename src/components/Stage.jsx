import { useState } from 'react'
import './Stage.css'
import ChannelStrip from './ChannelStrip.jsx'
import StageView from './StageView.jsx'
import { resolveEmbed } from '../lib/stage.js'
import { showPackage } from '../lib/demoSites.js'

// Everything inside the "Live stage" section: the frame, the side panel and
// the channel strip. `works` is already filtered and ordered by the parent.
function Stage({ works, selectedId, onSelect, onOpenStory }) {
  const index = Math.max(
    0,
    works.findIndex((work) => work.id === selectedId),
  )
  const work = works[index]
  const embed = resolveEmbed(work)
  const number = String(index + 1).padStart(2, '0')
  // Desktop / Mobile preview, kept while flipping channels.
  const [view, setView] = useState('desktop')
  // The static burst only plays on a channel change, not on first load.
  const [initialId] = useState(work.id)

  return (
    <div className="stage">
      <div
        className="stage-grid"
        id="stage-panel"
        role="tabpanel"
        aria-labelledby={`channel-${work.id}`}
      >
        <StageView
          key={work.id}
          work={work}
          embed={embed}
          number={number}
          view={view}
          onViewChange={setView}
          switched={work.id !== initialId}
        />

        <aside className="stage-side" key={`side-${work.id}`} aria-label="About this project">
          <p className="stage-side-label">What you&rsquo;re looking at</p>
          <h3 className="stage-side-title">{work.title}</h3>
          {work.description && <p className="stage-side-text">{work.description}</p>}

          {work.buildStory && (
            <button
              type="button"
              className="stage-story-button"
              onClick={() => onOpenStory(work.id)}
            >
              How I built it <span aria-hidden="true">→</span>
            </button>
          )}

          <dl className="stage-side-rows">
            <div className="stage-side-row">
              <dt>Category</dt>
              <dd>{work.typeLabel ?? work.category}</dd>
            </div>
            {work.tools.length > 0 && (
              <div className="stage-side-row">
                <dt>Stack</dt>
                <dd>{work.tools.join(' · ')}</dd>
              </div>
            )}
          </dl>

          {work.packageId && (
            <button
              type="button"
              className="stage-link stage-package-link"
              onClick={() => showPackage(work.packageId)}
            >
              This is my {work.packageId[0].toUpperCase() + work.packageId.slice(1)} package{' '}
              <span aria-hidden="true">→</span>
            </button>
          )}
        </aside>
      </div>

      <ChannelStrip works={works} selectedId={work.id} onSelect={onSelect} />
    </div>
  )
}

export default Stage
