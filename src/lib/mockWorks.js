// Dev-only sample data so the Live Stage and admin can be developed without a
// Supabase project. Used only when running `npm run dev` with no Supabase env
// vars. Rows use the database's snake_case shape and go through the same
// parsing as real rows; edits made in the admin live in memory only.

export const USE_MOCK_WORKS =
  import.meta.env.DEV &&
  !(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)

// Override with VITE_MOCK_TRACKLINE_URL in .env.local, e.g. '/dev/mock-trackline.html'
// for the offline stand-in page.
const TRACKLINE_URL =
  import.meta.env.VITE_MOCK_TRACKLINE_URL ||
  'https://application-tracker-virid-one.vercel.app?demo=1'

function slide(label, bg, fg = '#ededea') {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800">` +
    `<rect width="1280" height="800" fill="${bg}"/>` +
    `<text x="640" y="410" font-family="sans-serif" font-size="56" fill="${fg}" text-anchor="middle">${label}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function row(id, order, fields) {
  return {
    id,
    category: 'Code',
    description: '',
    project_url: null,
    image_paths: [],
    embed_kind: 'none',
    embed_url: null,
    try_hint: null,
    tools: [],
    build_story: null,
    display_order: order,
    published: true,
    created_at: '2026-01-01T00:00:00Z',
    ...fields,
  }
}

export const MOCK_ROWS = [
  row('mock-trackline', 1, {
    title: 'Trackline',
    description:
      'An application tracker with a guided demo you can use right here. [mock data]',
    project_url: TRACKLINE_URL,
    embed_kind: 'iframe',
    try_hint: 'Click an application card and move it to another column.',
    tools: ['React', 'Supabase', 'Claude Code'],
    image_paths: [slide('Trackline preview', '#1e1e23')],
    build_story: {
      steps: [
        {
          type: 'prompt',
          title: 'The first prompt',
          text: 'I started with one sentence and no design.',
          prompt:
            'Build a job application tracker. Columns for applied, interview, offer. Keep it fast and simple.',
          image_path: '',
          date: '2026-03-02',
          public: true,
        },
        {
          type: 'first_version',
          title: 'A board that worked',
          text: 'Drag and drop, local storage, ugly but usable.',
          prompt: '',
          image_path: '',
          date: '2026-03-03',
          public: true,
        },
        {
          type: 'iteration',
          title: 'HIDDEN: private note',
          text: 'This step is hidden and must never reach a visitor.',
          prompt: 'HIDDEN PROMPT: do not show this.',
          image_path: '',
          date: '2026-03-05',
          public: false,
        },
        {
          type: 'shipped',
          title: 'Shipped with a guided demo',
          text: 'Added Supabase auth and a demo mode so anyone can try it.',
          prompt: '',
          image_path: '',
          date: '2026-03-09',
          public: true,
        },
      ],
      stats: { prompts: 42, days: 7, commits: 61 },
      lesson: 'Ship the ugly version first; the second prompt is always better.',
    },
  }),
  row('mock-video', 2, {
    title: 'Launch film',
    category: 'Other',
    description: 'A 20-second AI-generated product film. [mock data]',
    embed_kind: 'video',
    embed_url: '/trackline-tour.webm?v=6',
    try_hint: 'Press play. It starts muted.',
    tools: ['Higgsfield', 'Claude Code'],
  }),
  row('mock-agent', 3, {
    title: 'Inbox agent',
    description: 'An AI agent that sorts and drafts replies to routine email. [mock data]',
    try_hint: 'Use the arrows to step through the screens.',
    tools: ['Claude API', 'Node'],
    image_paths: [
      slide('Inbox agent · 1', '#25252b'),
      slide('Inbox agent · 2', '#1a2a33'),
      slide('Inbox agent · 3', '#2b2230'),
    ],
  }),
  row('mock-blocked', 4, {
    title: 'Unreachable demo',
    description:
      'Its live embed never loads, so the stage falls back to the preview. [mock data]',
    project_url: 'http://127.0.0.1:1/',
    embed_kind: 'iframe',
    try_hint: 'Wait a moment, or press "Show preview instead".',
    tools: ['Vite'],
    image_paths: [slide('Preview fallback', '#2a1f1b')],
  }),
  row('mock-award', 5, {
    title: 'Hackathon finalist',
    category: 'Achievements',
    description: 'Finalist at a regional student hackathon. [mock data]',
    image_paths: [slide('Finalist', '#1f2a1f')],
  }),
]
