import { createWork, findLegacyIds } from './works.js'
import { readLegacyWorks } from '../legacyDb.js'

// Base64 data URLs were the old storage format; Supabase Storage wants files.
async function dataUrlToFile(dataUrl, name) {
  const response = await fetch(dataUrl)
  const blob = await response.blob()
  const extension = (blob.type.split('/')[1] || 'png').replace('jpeg', 'jpg')
  return new File([blob], `${name}.${extension}`, {
    type: blob.type || 'image/png',
  })
}

export async function inspectLegacyWorks() {
  const works = await readLegacyWorks()
  if (works.length === 0) {
    return { works: [], alreadyImported: [], importable: [] }
  }

  // legacy_id carries the old IndexedDB id, so re-running the import skips
  // anything already in Supabase rather than duplicating it.
  const existing = await findLegacyIds(works.map((work) => String(work.id)))
  const alreadyImported = works.filter((work) =>
    existing.has(String(work.id)),
  )
  const importable = works.filter((work) => !existing.has(String(work.id)))

  return { works, alreadyImported, importable }
}

export async function importLegacyWorks(works, onProgress) {
  const imported = []
  const failed = []

  for (let index = 0; index < works.length; index += 1) {
    const work = works[index]
    onProgress?.({ done: index, total: works.length, title: work.title })

    try {
      const files = await Promise.all(
        (work.images ?? []).map((image, imageIndex) =>
          dataUrlToFile(image, `import-${imageIndex + 1}`),
        ),
      )

      await createWork(
        {
          title: work.title || 'Untitled',
          category: work.category || 'Other',
          description: work.description ?? '',
          link: work.link ?? '',
          legacyId: String(work.id),
          displayOrder: index + 1,
        },
        files,
      )

      imported.push(work.title)
    } catch (error) {
      failed.push({ title: work.title, message: error.message })
    }
  }

  onProgress?.({ done: works.length, total: works.length, title: '' })
  return { imported, failed }
}
