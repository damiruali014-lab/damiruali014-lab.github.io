// Dev-only sample data so the Live Stage can be developed without a Supabase
// project. Used only when running `npm run dev` with no Supabase env vars.

export const USE_MOCK_WORKS =
  import.meta.env.DEV &&
  !(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)

// Set VITE_MOCK_TRACKLINE_URL in .env.local to see the real demo on the stage.
const TRACKLINE_URL =
  import.meta.env.VITE_MOCK_TRACKLINE_URL || '/dev/mock-trackline.html'

function slide(label, bg, fg = '#ededea') {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800">` +
    `<rect width="1280" height="800" fill="${bg}"/>` +
    `<text x="640" y="410" font-family="sans-serif" font-size="56" fill="${fg}" text-anchor="middle">${label}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function mock(id, order, fields) {
  return {
    id,
    category: 'Code',
    description: '',
    link: '',
    imagePaths: [],
    images: [],
    embedKind: 'none',
    embedUrl: '',
    tryHint: '',
    tools: [],
    displayOrder: order,
    published: true,
    createdAt: '2026-01-01T00:00:00Z',
    ...fields,
  }
}

export const MOCK_WORKS = [
  mock('mock-trackline', 1, {
    title: 'Trackline',
    description:
      'A shipment tracker with a live map, status filters and a guided demo. [mock data]',
    link: TRACKLINE_URL,
    embedKind: 'iframe',
    tryHint: 'Tap a shipment to select it, then add a new one.',
    tools: ['React', 'Supabase', 'Claude Code'],
    images: [slide('Trackline preview', '#1e1e23')],
  }),
  mock('mock-video', 2, {
    title: 'Launch film',
    category: 'Other',
    description: 'A 20-second AI-generated product film. [mock data]',
    embedKind: 'video',
    embedUrl: '/trackline-tour.webm?v=6',
    tryHint: 'Press play. It starts muted.',
    tools: ['Higgsfield', 'Claude Code'],
  }),
  mock('mock-agent', 3, {
    title: 'Inbox agent',
    description: 'An AI agent that sorts and drafts replies to routine email. [mock data]',
    tryHint: 'Use the arrows to step through the screens.',
    tools: ['Claude API', 'Node'],
    images: [slide('Inbox agent · 1', '#25252b'), slide('Inbox agent · 2', '#1a2a33'), slide('Inbox agent · 3', '#2b2230')],
  }),
  mock('mock-blocked', 4, {
    title: 'Unreachable demo',
    description:
      'Its live embed never loads, so the stage falls back to the preview after a few seconds. [mock data]',
    link: 'http://127.0.0.1:1/',
    embedKind: 'iframe',
    tryHint: 'Wait a few seconds, or press "Show preview instead".',
    tools: ['Vite'],
    images: [slide('Preview fallback', '#2a1f1b')],
  }),
  mock('mock-award', 5, {
    title: 'Hackathon finalist',
    category: 'Achievements',
    description: 'Finalist at a regional student hackathon. [mock data]',
    images: [slide('Finalist', '#1f2a1f')],
  }),
]
