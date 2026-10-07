import { useState } from 'react'

// What fills the stage frame: the live embed, a video, or an image carousel.
function StageScreen({ work, embed, status, onFrameLoad }) {
  if (embed.kind === 'iframe' && status !== 'fallback') {
    return (
      <iframe
        className="stage-iframe"
        src={embed.src}
        title={`${work.title} live demo`}
        loading="lazy"
        sandbox="allow-scripts allow-same-origin allow-forms"
        referrerPolicy="no-referrer"
        onLoad={onFrameLoad}
      />
    )
  }

  const videoSrc = embed.kind === 'video' ? embed.src : embed.fallbackVideo
  if (videoSrc) {
    return (
      <video
        className="stage-video"
        src={videoSrc}
        poster={work.images[0]}
        muted
        controls
        playsInline
        preload="metadata"
        aria-label={`${work.title} video`}
      />
    )
  }

  if (work.images.length > 0) {
    return <StageImages images={work.images} title={work.title} />
  }

  return <p className="stage-empty">No preview yet.</p>
}

function StageImages({ images, title }) {
  const [index, setIndex] = useState(0)
  const count = images.length
  const go = (step) => setIndex((current) => (current + step + count) % count)

  return (
    <div className="stage-images">
      <img
        className="stage-image"
        src={images[index]}
        alt={`${title}, image ${index + 1} of ${count}`}
      />
      {count > 1 && (
        <div className="stage-images-nav">
          <button type="button" aria-label="Previous image" onClick={() => go(-1)}>
            ←
          </button>
          <span className="stage-images-count">
            {index + 1} / {count}
          </span>
          <button type="button" aria-label="Next image" onClick={() => go(1)}>
            →
          </button>
        </div>
      )}
    </div>
  )
}

export default StageScreen
