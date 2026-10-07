import { useId, useState } from 'react'
import { STEP_TYPES, emptyStep, publicStory } from '../lib/story.js'
import { validateImage } from '../lib/images.js'
import StoryDrawer from './StoryDrawer.jsx'

const typeLabel = (value) => STEP_TYPES.find((type) => type.value === value)?.label ?? value

// Admin editor for works.build_story: add / remove / reorder steps, edit each
// one, attach an image, and choose which steps visitors can see.
function BuildStoryEditor({ value, onChange, onError, disabled, workTitle }) {
  const uid = useId()
  const [previewing, setPreviewing] = useState(false)

  const { steps } = value
  const update = (patch) => onChange({ ...value, ...patch })
  const setSteps = (next) => update({ steps: next })
  const patchStep = (index, patch) =>
    setSteps(steps.map((step, position) => (position === index ? { ...step, ...patch } : step)))

  function addStep() {
    // Suggest the natural next type, but it is just a default.
    const next = steps.length === 0 ? 'prompt' : 'iteration'
    setSteps([...steps, emptyStep(next)])
  }

  function removeStep(index) {
    const step = steps[index]
    if (step.file && step.imageUrl) URL.revokeObjectURL(step.imageUrl)
    setSteps(steps.filter((_, position) => position !== index))
  }

  function moveStep(index, direction) {
    const target = index + direction
    if (target < 0 || target >= steps.length) return
    const next = [...steps]
    ;[next[index], next[target]] = [next[target], next[index]]
    setSteps(next)
  }

  function pickImage(index, event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const problem = validateImage(file)
    if (problem) {
      onError(problem)
      return
    }
    onError('')

    const step = steps[index]
    if (step.file && step.imageUrl) URL.revokeObjectURL(step.imageUrl)
    patchStep(index, { file, imageUrl: URL.createObjectURL(file) })
  }

  function removeImage(index) {
    const step = steps[index]
    if (step.file && step.imageUrl) URL.revokeObjectURL(step.imageUrl)
    patchStep(index, { file: null, imageUrl: '', imagePath: '' })
  }

  const visible = publicStory(value)
  const hiddenCount = steps.length - (visible?.steps.length ?? 0)

  return (
    <fieldset className="story-editor" disabled={disabled}>
      <legend className="add-work-label story-legend">How I built it</legend>
      <p className="story-help">
        A timeline from the first prompt to the shipped product. Visitors only
        see steps marked <strong>Public</strong>; a project with no public steps
        has no &ldquo;How I built it&rdquo; button.
      </p>

      {steps.length === 0 && <p className="story-empty">No steps yet.</p>}

      <ol className="story-steps">
        {steps.map((step, index) => {
          const id = `${uid}-${step.key}`
          return (
            <li
              key={step.key}
              className={`story-step${step.public ? '' : ' is-hidden'}`}
            >
              <div className="story-step-head">
                <span className="story-step-title">
                  Step {index + 1} · {typeLabel(step.type)}
                </span>
                <span className="story-step-tools">
                  <button
                    type="button"
                    className="story-icon"
                    aria-label={`Move step ${index + 1} up`}
                    disabled={index === 0}
                    onClick={() => moveStep(index, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="story-icon"
                    aria-label={`Move step ${index + 1} down`}
                    disabled={index === steps.length - 1}
                    onClick={() => moveStep(index, 1)}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="story-icon is-danger"
                    aria-label={`Remove step ${index + 1}`}
                    onClick={() => removeStep(index)}
                  >
                    ✕
                  </button>
                </span>
              </div>

              <div className="story-row">
                <div className="add-work-field">
                  <label className="add-work-label" htmlFor={`${id}-type`}>
                    Type
                  </label>
                  <select
                    id={`${id}-type`}
                    className="add-work-input"
                    value={step.type}
                    onChange={(event) => patchStep(index, { type: event.target.value })}
                  >
                    {STEP_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="add-work-field">
                  <label className="add-work-label" htmlFor={`${id}-date`}>
                    Date
                  </label>
                  <input
                    id={`${id}-date`}
                    className="add-work-input"
                    type="date"
                    value={step.date}
                    onChange={(event) => patchStep(index, { date: event.target.value })}
                  />
                </div>
              </div>

              <div className="add-work-field">
                <label className="add-work-label" htmlFor={`${id}-title`}>
                  Title
                </label>
                <input
                  id={`${id}-title`}
                  className="add-work-input"
                  value={step.title}
                  onChange={(event) => patchStep(index, { title: event.target.value })}
                />
              </div>

              <div className="add-work-field">
                <label className="add-work-label" htmlFor={`${id}-text`}>
                  Text
                </label>
                <textarea
                  id={`${id}-text`}
                  className="add-work-input"
                  rows="2"
                  value={step.text}
                  onChange={(event) => patchStep(index, { text: event.target.value })}
                />
              </div>

              <div className="add-work-field">
                <label className="add-work-label" htmlFor={`${id}-prompt`}>
                  Prompt excerpt (curated, not the full chat)
                </label>
                <textarea
                  id={`${id}-prompt`}
                  className="add-work-input story-mono"
                  rows="3"
                  value={step.prompt}
                  onChange={(event) => patchStep(index, { prompt: event.target.value })}
                />
              </div>

              <div className="add-work-field">
                <label className="add-work-label" htmlFor={`${id}-image`}>
                  Image (optional)
                </label>
                <input
                  id={`${id}-image`}
                  className="add-work-file"
                  type="file"
                  accept="image/*"
                  onChange={(event) => pickImage(index, event)}
                />
                {step.imageUrl && (
                  <div className="story-image">
                    <img className="add-work-thumb" src={step.imageUrl} alt="" />
                    <button
                      type="button"
                      className="add-work-cancel"
                      onClick={() => removeImage(index)}
                    >
                      Remove image
                    </button>
                  </div>
                )}
              </div>

              {!step.public && (step.imageUrl || step.imagePath) && (
                <p className="story-help">
                  This image is stored in the public image bucket. Its link is
                  never shown, but it is not private.
                </p>
              )}

              <label className="story-public">
                <input
                  type="checkbox"
                  checked={step.public}
                  onChange={(event) => patchStep(index, { public: event.target.checked })}
                />
                <span>
                  <strong>Public</strong>{' '}
                  <span className="story-public-note">
                    {step.public ? '· visitors can see this step' : '· hidden from visitors'}
                  </span>
                </span>
              </label>
            </li>
          )
        })}
      </ol>

      <div className="story-actions">
        <button type="button" className="add-work-cancel" onClick={addStep}>
          + Add step
        </button>
        <button
          type="button"
          className="add-work-cancel"
          onClick={() => setPreviewing(true)}
        >
          Preview as visitor
        </button>
      </div>

      <div className="story-footer">
        <div className="story-row is-three">
          {[
            ['prompts', 'Prompts'],
            ['days', 'Days'],
            ['commits', 'Commits'],
          ].map(([key, label]) => (
            <div className="add-work-field" key={key}>
              <label className="add-work-label" htmlFor={`${uid}-${key}`}>
                {label}
              </label>
              <input
                id={`${uid}-${key}`}
                className="add-work-input"
                type="number"
                min="0"
                inputMode="numeric"
                value={value.stats[key]}
                onChange={(event) =>
                  update({ stats: { ...value.stats, [key]: event.target.value } })
                }
              />
            </div>
          ))}
        </div>
        <div className="add-work-field">
          <label className="add-work-label" htmlFor={`${uid}-lesson`}>
            What I learned
          </label>
          <input
            id={`${uid}-lesson`}
            className="add-work-input"
            value={value.lesson}
            onChange={(event) => update({ lesson: event.target.value })}
          />
        </div>
      </div>

      <p className="story-help story-summary-line">
        Visitors see {visible?.steps.length ?? 0} of {steps.length} steps
        {hiddenCount > 0 && ` (${hiddenCount} hidden)`}.
      </p>

      {previewing && !visible && (
        <p className="story-help" role="status">
          No public steps, so visitors will not see a &ldquo;How I built it&rdquo; button.
        </p>
      )}
      {previewing && visible && (
        <StoryDrawer
          title={workTitle || 'Untitled project'}
          story={{
            steps: visible.steps,
            stats: {
              prompts: Number(value.stats.prompts) || 0,
              days: Number(value.stats.days) || 0,
              commits: Number(value.stats.commits) || 0,
            },
            lesson: value.lesson.trim(),
          }}
          onClose={() => setPreviewing(false)}
        />
      )}
    </fieldset>
  )
}

export default BuildStoryEditor
