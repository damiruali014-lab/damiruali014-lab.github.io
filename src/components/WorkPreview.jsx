import { useEffect, useState } from 'react'
import './WorkPreview.css'
import { usePrefersReducedMotion } from '../hooks.js'

function WorkPreview({ images, title, href }) {
  const previewImages = images.slice(0, 3)
  const [activeImage, setActiveImage] = useState(0)
  const prefersReducedMotion = usePrefersReducedMotion()
  const isDirectDemo = href?.includes('demo=1')
  const visibleImage = activeImage % previewImages.length

  useEffect(() => {
    if (isDirectDemo || previewImages.length < 2) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reducedMotion.matches) return

    const interval = window.setInterval(() => {
      setActiveImage((current) => (current + 1) % previewImages.length)
    }, 3800)

    return () => window.clearInterval(interval)
  }, [isDirectDemo, previewImages.length])

  if (isDirectDemo) {
    return (
      <div className="work-preview">
        <div className="work-preview-link">
          <span className="work-preview-frame">
            <video
              className="work-preview-tour"
              autoPlay={!prefersReducedMotion}
              muted
              loop
              playsInline
              preload="auto"
              poster={images[0]}
              onLoadedMetadata={(event) => {
                event.currentTarget.defaultPlaybackRate = 1.25
                event.currentTarget.playbackRate = 1.25
              }}
              aria-label={`${title} guided product tour`}
            >
              <source src="/trackline-tour.webm?v=6" type="video/webm" />
            </video>
          </span>
          <a
            className="work-preview-hit"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${title} interactive demo`}
          />
          <span className="work-preview-live">
            <span aria-hidden="true" />
            Guided demo · click to explore
          </span>
        </div>
      </div>
    )
  }

  const preview = (
    <>
      <span className="work-preview-frame">
        {previewImages.map((image, position) => (
          <img
            key={`${image}-${position}`}
            className={`work-preview-image${position === visibleImage ? ' is-active' : ''}`}
            src={image}
            alt={position === 0 ? `${title} project preview` : ''}
            aria-hidden={position !== visibleImage}
          />
        ))}
      </span>
    </>
  )

  return (
    <div className="work-preview">
      {href ? (
        <a
          className="work-preview-link"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${title} live project`}
        >
          {preview}
        </a>
      ) : (
        <div className="work-preview-link">{preview}</div>
      )}
    </div>
  )
}

export default WorkPreview
