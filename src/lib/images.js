import { supabase } from './supabase.js'

export const BUCKET = 'work-images'
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]

export function validateImage(file) {
  if (!file.type.startsWith('image/') || !ALLOWED_TYPES.includes(file.type)) {
    return `${file.name}: only JPEG, PNG, WebP, GIF or AVIF images are allowed.`
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `${file.name}: larger than 5 MB.`
  }
  return null
}

function extensionFor(file) {
  const fromType = file.type.split('/')[1] ?? 'bin'
  return fromType === 'jpeg' ? 'jpg' : fromType.replace(/[^a-z0-9]/g, '')
}

// Unique, non-guessable path; the work id prefix keeps a project's files
// together so deleting a project can clean up by prefix if needed.
export function buildImagePath(workId, file) {
  const unique = crypto.randomUUID ? crypto.randomUUID() : String(Date.now())
  return `${workId}/${unique}.${extensionFor(file)}`
}

export function publicUrlFor(path) {
  if (!supabase || !path) return ''
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

export async function removeImages(paths) {
  if (!supabase || paths.length === 0) return
  await supabase.storage.from(BUCKET).remove(paths)
}

/**
 * Uploads files one at a time so progress is meaningful and so a failure can
 * roll back cleanly: anything already uploaded in this batch is removed again,
 * leaving no orphans in the bucket.
 */
export async function uploadImages(workId, files, onProgress) {
  if (!supabase) throw new Error('Supabase is not configured.')

  const uploaded = []

  try {
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index]
      const problem = validateImage(file)
      if (problem) throw new Error(problem)

      onProgress?.({ done: index, total: files.length, name: file.name })

      const path = buildImagePath(workId, file)
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false })

      if (error) throw new Error(`${file.name}: ${error.message}`)
      uploaded.push(path)
    }

    onProgress?.({ done: files.length, total: files.length, name: '' })
    return uploaded
  } catch (error) {
    await removeImages(uploaded).catch(() => {})
    throw error
  }
}
