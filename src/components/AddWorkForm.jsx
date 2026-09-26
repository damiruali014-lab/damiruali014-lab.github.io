import { useEffect, useRef, useState } from 'react'
import './AddWorkForm.css'
import { createWork, newWorkId, updateWork } from '../lib/works.js'
import { requestEdit, subscribeToEditRequests } from '../lib/editBus.js'
import { validateImage } from '../lib/images.js'

const categories = ['Code', 'Other', 'Achievements']

const emptyFields = {
  id: null,
  title: '',
  category: 'Code',
  description: '',
  link: '',
}

function AddWorkForm() {
  const [fields, setFields] = useState(emptyFields)
  // Images already in Supabase Storage: { path, url }.
  const [existingImages, setExistingImages] = useState([])
  const [originalPaths, setOriginalPaths] = useState([])
  // Newly picked files, previewed from object URLs until they are uploaded.
  const [newImages, setNewImages] = useState([])
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef(null)

  const isEditing = fields.id !== null

  useEffect(
    () =>
      subscribeToEditRequests((work) => {
        setNewImages((current) => {
          current.forEach((image) => URL.revokeObjectURL(image.preview))
          return []
        })

        if (!work) {
          setFields(emptyFields)
          setExistingImages([])
          setOriginalPaths([])
        } else {
          setFields({
            id: work.id,
            title: work.title,
            category: work.category,
            description: work.description ?? '',
            link: work.link ?? '',
          })
          setExistingImages(
            (work.imagePaths ?? []).map((path, index) => ({
              path,
              url: work.images?.[index] ?? '',
            })),
          )
          setOriginalPaths(work.imagePaths ?? [])
        }

        setStatus('')
        setError('')
      }),
    [],
  )

  // Object URLs are per-selection; release them when the form goes away.
  useEffect(
    () => () => {
      setNewImages((current) => {
        current.forEach((image) => URL.revokeObjectURL(image.preview))
        return []
      })
    },
    [],
  )

  function clearFileInput() {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function resetForm() {
    newImages.forEach((image) => URL.revokeObjectURL(image.preview))
    setFields(emptyFields)
    setExistingImages([])
    setOriginalPaths([])
    setNewImages([])
    clearFileInput()
  }

  function handleChange(event) {
    const { name, value } = event.target
    setFields((current) => ({ ...current, [name]: value }))
  }

  function handleFilesChange(event) {
    const picked = Array.from(event.target.files)
    clearFileInput()
    if (picked.length === 0) return

    const rejected = picked.map(validateImage).filter(Boolean)
    if (rejected.length > 0) {
      setError(rejected.join(' '))
      return
    }

    setError('')
    setNewImages((current) => [
      ...current,
      ...picked.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ])
  }

  function handleRemoveExisting(path) {
    setExistingImages((current) => current.filter((item) => item.path !== path))
  }

  function handleRemoveNew(index) {
    setNewImages((current) => {
      URL.revokeObjectURL(current[index].preview)
      return current.filter((_, position) => position !== index)
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSaving(true)
    setStatus('')
    setError('')

    const files = newImages.map((image) => image.file)

    try {
      if (isEditing) {
        await updateWork(
          fields.id,
          { ...fields, previousPaths: originalPaths },
          existingImages.map((image) => image.path),
          files,
          setProgress,
        )
        setStatus('Project updated.')
      } else {
        await createWork({ ...fields, id: newWorkId() }, files, setProgress)
        setStatus('Project saved.')
      }

      resetForm()
      requestEdit(null)
    } catch (saveError) {
      setError(saveError.message || 'Could not save that project.')
    } finally {
      setProgress(null)
      setIsSaving(false)
    }
  }

  function handleCancel() {
    resetForm()
    setStatus('')
    setError('')
    requestEdit(null)
  }

  const savingLabel = progress
    ? `Uploading image ${Math.min(progress.done + 1, progress.total)} of ${progress.total}...`
    : 'Saving...'

  return (
    <section className="add-work">
      <h2 className="add-work-heading">
        {isEditing ? 'Edit project' : 'Add a project'}
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="add-work-field">
          <label className="add-work-label" htmlFor="work-title">
            Title
          </label>
          <input
            id="work-title"
            className="add-work-input"
            name="title"
            value={fields.title}
            onChange={handleChange}
            required
          />
        </div>
        <div className="add-work-field">
          <label className="add-work-label" htmlFor="work-category">
            Category
          </label>
          <select
            id="work-category"
            className="add-work-input"
            name="category"
            value={fields.category}
            onChange={handleChange}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div className="add-work-field">
          <label className="add-work-label" htmlFor="work-description">
            Description
          </label>
          <textarea
            id="work-description"
            className="add-work-input"
            name="description"
            value={fields.description}
            onChange={handleChange}
            rows="3"
          />
        </div>
        <div className="add-work-field">
          <label className="add-work-label" htmlFor="work-link">
            Project URL
          </label>
          <input
            id="work-link"
            className="add-work-input"
            name="link"
            type="url"
            placeholder="https://example.com"
            value={fields.link}
            onChange={handleChange}
          />
        </div>
        <div className="add-work-field">
          <label className="add-work-label" htmlFor="work-images">
            Images
          </label>
          <input
            id="work-images"
            ref={fileInputRef}
            className="add-work-file"
            name="images"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilesChange}
          />
          {(existingImages.length > 0 || newImages.length > 0) && (
            <ul className="add-work-preview">
              {existingImages.map((image, index) => (
                <li key={image.path} className="add-work-preview-item">
                  <img
                    className="add-work-thumb"
                    src={image.url}
                    alt={`Saved image ${index + 1}`}
                  />
                  <button
                    type="button"
                    className="add-work-thumb-remove"
                    aria-label={`Remove saved image ${index + 1}`}
                    onClick={() => handleRemoveExisting(image.path)}
                  >
                    ✕
                  </button>
                </li>
              ))}
              {newImages.map((image, index) => (
                <li key={image.preview} className="add-work-preview-item">
                  <img
                    className="add-work-thumb"
                    src={image.preview}
                    alt={`New image ${index + 1}`}
                  />
                  <button
                    type="button"
                    className="add-work-thumb-remove"
                    aria-label={`Remove new image ${index + 1}`}
                    onClick={() => handleRemoveNew(index)}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="add-work-buttons">
          <button type="submit" className="add-work-submit" disabled={isSaving}>
            {isSaving
              ? savingLabel
              : isEditing
                ? 'Update project'
                : 'Save project'}
          </button>
          {isEditing && (
            <button
              type="button"
              className="add-work-cancel"
              onClick={handleCancel}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
      {status && <p className="add-work-status">{status}</p>}
      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}

export default AddWorkForm
