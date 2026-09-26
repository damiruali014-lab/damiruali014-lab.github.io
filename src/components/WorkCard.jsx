import WorkPreview from './WorkPreview.jsx'
import { requestEdit } from '../lib/editBus.js'

function WorkCard({
  work,
  position,
  span,
  variant,
  isBeingEdited,
  isDeleting,
  isAdmin,
  onDelete,
}) {
  const images = work.images ?? []
  const url = (work.link ?? '').trim()
  // While a card is open in the admin form, clicking it must not navigate.
  const href = isBeingEdited ? '' : url
  const isTrackline = work.title.trim().toLowerCase() === 'trackline'
  const destination =
    href && isTrackline
      ? `${href}${href.includes('?') ? '&' : '?'}demo=1`
      : href
  const number = String(position + 1).padStart(2, '0')

  return (
    <li
      className={`works-card ${images.length > 0 ? 'has-media' : 'no-media'}${
        isBeingEdited ? ' is-editing' : ''
      }`}
      data-span={span}
      data-variant={variant}
      style={{
        '--span': span,
        '--enter-delay': `${Math.min(position, 8) * 60}ms`,
      }}
    >
      {images.length > 0 && (
        <WorkPreview images={images} title={work.title} href={destination} />
      )}

      <div className="works-card-body">
        <div className="works-card-meta">
          <span className="works-card-number" aria-hidden="true">
            Case {number}
          </span>
          <span className="works-card-category">{work.category}</span>

          {isAdmin && (
            <span className="works-card-admin">
              <button
                type="button"
                className="works-card-action"
                onClick={() => requestEdit(work)}
              >
                Edit
              </button>
              <button
                type="button"
                className="works-card-action is-delete"
                aria-label={`Delete ${work.title}`}
                disabled={isDeleting}
                onClick={() => onDelete(work)}
              >
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </span>
          )}
        </div>

        <h3 className="works-card-title">
          {destination ? (
            <a
              className="works-card-title-link"
              href={destination}
              target="_blank"
              rel="noopener noreferrer"
            >
              {work.title}
            </a>
          ) : (
            work.title
          )}
        </h3>

        {work.description && (
          <p className="works-card-description">{work.description}</p>
        )}

        {destination && (
          <a
            className="works-card-cta"
            href={destination}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>{isTrackline ? 'Try live demo' : 'View project'}</span>
            <span className="works-card-cta-arrow" aria-hidden="true">↗</span>
          </a>
        )}
      </div>
    </li>
  )
}

export default WorkCard
