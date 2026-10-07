// The "How I built it" story: parsing what the database holds, keeping hidden
// steps away from visitors, and converting to and from the admin editor shape.
//
// Stored shape (works.build_story):
//   { steps: [{ type, title, text, prompt, image_path, date, public }],
//     stats: { prompts, days, commits }, lesson }

export const STEP_TYPES = [
  { value: 'prompt', label: 'Prompt' },
  { value: 'first_version', label: 'First version' },
  { value: 'iteration', label: 'Iteration' },
  { value: 'shipped', label: 'Shipped' },
]

const TYPE_VALUES = new Set(STEP_TYPES.map((type) => type.value))

const text = (value) => (typeof value === 'string' ? value : '')
const count = (value) => {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0
}

/** Database JSON -> app shape. Returns null when there is nothing in it. */
export function normalizeStory(raw, toUrl = (path) => path) {
  if (!raw || typeof raw !== 'object') return null

  const steps = (Array.isArray(raw.steps) ? raw.steps : [])
    .filter((step) => step && typeof step === 'object')
    .map((step) => ({
      type: TYPE_VALUES.has(step.type) ? step.type : 'iteration',
      title: text(step.title),
      text: text(step.text),
      prompt: text(step.prompt),
      imagePath: text(step.image_path),
      imageUrl: step.image_path ? toUrl(step.image_path) : '',
      date: text(step.date),
      // Fail closed: only an explicit `true` makes a step visible.
      public: step.public === true,
    }))

  const stats = {
    prompts: count(raw.stats?.prompts),
    days: count(raw.stats?.days),
    commits: count(raw.stats?.commits),
  }
  const lesson = text(raw.lesson)
  const hasStats = stats.prompts || stats.days || stats.commits

  if (steps.length === 0 && !lesson && !hasStats) return null
  return { steps, stats, lesson }
}

/**
 * What a visitor may see. Hidden steps are dropped here, in data, so they
 * never reach a component. No public steps means no story at all (and so no
 * "How I built it" button).
 */
export function publicStory(story) {
  if (!story) return null
  const steps = story.steps.filter((step) => step.public)
  return steps.length > 0 ? { ...story, steps } : null
}

/** Storage paths of step images in the stored JSON shape. */
export function jsonImagePaths(json) {
  return (Array.isArray(json?.steps) ? json.steps : [])
    .map((step) => step?.image_path)
    .filter(Boolean)
}

// ---- Admin editor shape ---------------------------------------------------
// Steps carry a stable `key` for React, and `file`/`imageUrl` for an image
// that has been picked but not uploaded yet. Stats are strings (input values).

let keyCounter = 0
const newKey = () => `step-${Date.now()}-${keyCounter++}`

export function emptyStep(type = 'prompt') {
  return {
    key: newKey(),
    type,
    title: '',
    text: '',
    prompt: '',
    imagePath: '',
    imageUrl: '',
    file: null,
    date: '',
    public: true, // new steps start visible
  }
}

export function emptyEditorStory() {
  return { steps: [], stats: { prompts: '', days: '', commits: '' }, lesson: '' }
}

export function storyToEditor(story) {
  if (!story) return emptyEditorStory()
  const show = (value) => (value ? String(value) : '')
  return {
    steps: story.steps.map((step) => ({ ...step, key: newKey(), file: null })),
    stats: {
      prompts: show(story.stats.prompts),
      days: show(story.stats.days),
      commits: show(story.stats.commits),
    },
    lesson: story.lesson,
  }
}

/** Editor shape -> database JSON. `addedPaths` lines up with steps that have a file. */
export function editorToJson(editor, addedPaths = []) {
  if (!editor) return null

  let next = 0
  const steps = editor.steps.map((step) => ({
    type: step.type,
    title: step.title.trim(),
    text: step.text.trim(),
    prompt: step.prompt.trim(),
    image_path: step.file ? addedPaths[next++] : step.imagePath || '',
    date: step.date || '',
    public: step.public === true,
  }))

  const stats = {
    prompts: count(editor.stats.prompts),
    days: count(editor.stats.days),
    commits: count(editor.stats.commits),
  }
  const lesson = editor.lesson.trim()

  if (steps.length === 0 && !lesson && !stats.prompts && !stats.days && !stats.commits) {
    return null
  }
  return { steps, stats, lesson }
}

export function releaseStoryPreviews(editor) {
  editor?.steps.forEach((step) => {
    if (step.file && step.imageUrl) URL.revokeObjectURL(step.imageUrl)
  })
}
