// Pure helpers for the Live Stage: what to render for a work, and the
// #/work/<id> hash that makes a channel linkable.

const TRACKLINE_TOUR = '/trackline-tour.webm?v=6'

export function isTrackline(work) {
  return work.title.trim().toLowerCase() === 'trackline'
}

function withDemo(work, url) {
  if (!url || !isTrackline(work) || url.includes('demo=1')) return url
  return `${url}${url.includes('?') ? '&' : '?'}demo=1`
}

/**
 * Works saved before the stage existed have no embed fields, so everything
 * falls back to what they always had: images, plus the tour video for Trackline.
 */
export function resolveEmbed(work) {
  const link = (work.link ?? '').trim()
  const embedUrl = (work.embedUrl ?? '').trim()

  let kind = work.embedKind ?? 'none'
  if (kind === 'iframe' && !(embedUrl || link)) kind = 'none'
  if (kind === 'video' && !embedUrl) kind = 'none'

  if (kind === 'iframe') {
    const src = withDemo(work, embedUrl || link)
    return { kind, src, destination: src, fallbackVideo: isTrackline(work) ? TRACKLINE_TOUR : '' }
  }
  if (kind === 'video') {
    return { kind, src: embedUrl, destination: withDemo(work, link), fallbackVideo: '' }
  }
  return {
    kind: 'none',
    src: '',
    destination: withDemo(work, link),
    fallbackVideo: isTrackline(work) ? TRACKLINE_TOUR : '',
  }
}

const WORK_HASH = /^#?\/?work\/([^/?#]+)/

export function workIdFromHash(hash = window.location.hash) {
  return WORK_HASH.exec(hash)?.[1] ?? null
}

// location.replace with a fragment changes the URL and fires hashchange
// without piling up a history entry per channel click.
export function setWorkHash(id) {
  window.location.replace(`#/work/${id}`)
}

// ---- "How I built it" route: #/work/<id>/story --------------------------------
const STORY_HASH = /^#?\/?work\/[^/?#]+\/story\/?$/

export function isStoryHash(hash = window.location.hash) {
  return STORY_HASH.test(hash)
}

// Opening pushes a history entry, so the browser Back button closes the
// drawer. Closing then goes back instead of stacking another entry; a story
// that was opened from a pasted link has nothing to go back to, so it replaces.
let openedFromPage = false

export function openStory(id) {
  openedFromPage = true
  window.location.hash = `/work/${id}/story`
}

export function closeStory(id) {
  if (openedFromPage) {
    openedFromPage = false
    window.history.back()
  } else {
    setWorkHash(id)
  }
}
