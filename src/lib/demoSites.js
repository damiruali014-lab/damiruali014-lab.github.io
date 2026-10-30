/* =========================================================================
   Demo websites: extra Live Stage channels that live in code, not Supabase.
   Each one has the same shape as a work from works.js, plus:
     tags        extra filter chips it also shows under (besides category)
     typeLabel   shown as the Category line in the side panel
     packageId   the Services card its "This is my … package" link selects
   They slot in right after the SiteScout channel, in this order.
   ========================================================================= */

const preview = (name) => `${import.meta.env.BASE_URL}demos/${name}-preview.webp`

function demo(id, fields) {
  return {
    id,
    category: 'Websites',
    tags: ['Code'],
    link: fields.embedUrl,
    imagePaths: [],
    images: [],
    embedKind: 'iframe',
    tryHint: '',
    buildStory: null,
    published: true,
    ...fields,
  }
}

export const DEMO_SITES = [
  demo('demo-haluna', {
    title: 'Haluna',
    typeLabel: 'Premium package example · Online store',
    description:
      'A concept online store for a fictional sun care & beauty brand. Product pages with a shade switcher, a working cart and demo checkout, an SPF quiz, a live UV index from a weather API and custom scroll animations like cream pouring from the tube.',
    embedUrl: 'https://haluna-ten.vercel.app/',
    images: [preview('haluna')],
    tools: ['React', 'TypeScript', 'Tailwind', 'GSAP', 'Open-Meteo API'],
    packageId: 'premium',
  }),
  demo('demo-mira', {
    title: 'Mira Dental Studio',
    typeLabel: 'Standard package example · Business website',
    description:
      'A 5-page website for a fictional dental clinic: services with prices, team profiles, before/after results slider, multi-step online booking with calendar download, EN/RU language switch and FAQ.',
    embedUrl: 'https://mira-dental-jade.vercel.app/',
    images: [preview('mira')],
    tools: ['React', 'TypeScript', 'Tailwind', 'React Router'],
    packageId: 'standard',
  }),
  demo('demo-sora', {
    title: 'Sora Coffee',
    typeLabel: 'Basic package example · Landing page',
    description:
      'A one-page landing site for a fictional specialty coffee shop: live open/closed status, menu with tabs, gallery, map with directions and a WhatsApp order button.',
    embedUrl: 'https://sora-coffee.vercel.app/',
    images: [preview('sora')],
    tools: ['React', 'TypeScript', 'Tailwind'],
    packageId: 'basic',
  }),
]

const isSiteScout = (work) => work.title.trim().toLowerCase() === 'sitescout'

// Demos go right after SiteScout, or at the end if it is not in the list.
export function withDemoSites(works) {
  const index = works.findIndex(isSiteScout)
  if (index === -1) return [...works, ...DEMO_SITES]
  return [...works.slice(0, index + 1), ...DEMO_SITES, ...works.slice(index + 1)]
}

// A work shows under a filter chip by its category or any of its tags.
export function matchesFilter(work, filter) {
  return filter === 'All' || work.category === filter || (work.tags ?? []).includes(filter)
}

// ---- Cross-section links --------------------------------------------------
// Services → Live Stage ("See example site") and back ("This is my … package").
const CHANNEL_EVENT = 'stage-show-channel'
const PACKAGE_EVENT = 'services-show-package'

export function showChannel(id) {
  window.dispatchEvent(new CustomEvent(CHANNEL_EVENT, { detail: id }))
}

export function subscribeToChannelRequests(handler) {
  const listener = (event) => handler(event.detail)
  window.addEventListener(CHANNEL_EVENT, listener)
  return () => window.removeEventListener(CHANNEL_EVENT, listener)
}

export function showPackage(id) {
  window.dispatchEvent(new CustomEvent(PACKAGE_EVENT, { detail: id }))
}

export function subscribeToPackageRequests(handler) {
  const listener = (event) => handler(event.detail)
  window.addEventListener(PACKAGE_EVENT, listener)
  return () => window.removeEventListener(PACKAGE_EVENT, listener)
}
