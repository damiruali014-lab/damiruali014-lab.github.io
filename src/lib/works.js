import { supabase } from './supabase.js'
import { publicUrlFor, removeImages, uploadImages } from './images.js'

const TABLE = 'works'

// Database rows use snake_case; the UI components keep the shape they already
// had (`link`, `images`), so presentation code did not need rewriting.
function fromRow(row) {
  const paths = row.image_paths ?? []

  return {
    id: row.id,
    title: row.title,
    category: row.category,
    description: row.description ?? '',
    link: row.project_url ?? '',
    imagePaths: paths,
    images: paths.map(publicUrlFor),
    displayOrder: row.display_order ?? 0,
    published: row.published ?? true,
    createdAt: row.created_at,
  }
}

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

export function newWorkId() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now())
}

export async function listWorks() {
  const client = requireClient()

  const { data, error } = await client
    .from(TABLE)
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map(fromRow)
}

async function nextDisplayOrder(client) {
  const { data } = await client
    .from(TABLE)
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (data?.display_order ?? 0) + 1
}

/**
 * Images are uploaded before the row is written. If the insert fails the
 * uploads are removed again, so a failed save never leaves files behind.
 */
export async function createWork(fields, files, onProgress) {
  const client = requireClient()
  const id = fields.id ?? newWorkId()

  const paths = files.length > 0 ? await uploadImages(id, files, onProgress) : []

  const row = {
    id,
    title: fields.title,
    category: fields.category,
    description: fields.description ?? '',
    project_url: fields.link || null,
    image_paths: paths,
    display_order: fields.displayOrder ?? (await nextDisplayOrder(client)),
    legacy_id: fields.legacyId ?? null,
  }

  const { data, error } = await client
    .from(TABLE)
    .insert(row)
    .select()
    .single()

  if (error) {
    await removeImages(paths).catch(() => {})
    throw error
  }

  return fromRow(data)
}

/**
 * Order matters: new files go up first, then the row is updated with the full
 * ordered path list, and only once the database confirms are the removed
 * images deleted from storage. A failure at any step leaves the previous
 * images intact.
 */
export async function updateWork(id, fields, keptPaths, files, onProgress) {
  const client = requireClient()

  const addedPaths =
    files.length > 0 ? await uploadImages(id, files, onProgress) : []
  const finalPaths = [...keptPaths, ...addedPaths]

  const { data, error } = await client
    .from(TABLE)
    .update({
      title: fields.title,
      category: fields.category,
      description: fields.description ?? '',
      project_url: fields.link || null,
      image_paths: finalPaths,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    await removeImages(addedPaths).catch(() => {})
    throw error
  }

  const removed = (fields.previousPaths ?? []).filter(
    (path) => !finalPaths.includes(path),
  )
  if (removed.length > 0) {
    await removeImages(removed).catch(() => {})
  }

  return fromRow(data)
}

export async function deleteWork(id) {
  const client = requireClient()

  const { data: existing, error: lookupError } = await client
    .from(TABLE)
    .select('image_paths')
    .eq('id', id)
    .maybeSingle()
  if (lookupError) throw lookupError

  // Ask PostgREST to return the deleted id. A delete blocked by RLS may return
  // no error and affect zero rows; without this check the UI looked as if the
  // button did nothing.
  const { data: deleted, error } = await client
    .from(TABLE)
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle()
  if (error) throw error
  if (!deleted) {
    throw new Error(
      'The project was not deleted. Refresh your admin session and try again.',
    )
  }

  // Only after the row is gone, so a failed delete never orphans a card.
  const paths = existing?.image_paths ?? []
  if (paths.length > 0) {
    await removeImages(paths).catch(() => {})
  }
}

export async function findLegacyIds(legacyIds) {
  const client = requireClient()
  if (legacyIds.length === 0) return new Set()

  const { data, error } = await client
    .from(TABLE)
    .select('legacy_id')
    .in('legacy_id', legacyIds)

  if (error) throw error
  return new Set((data ?? []).map((row) => row.legacy_id))
}

// Any insert/update/delete from any browser re-triggers the caller's reload.
export function subscribeToWorks(handler) {
  if (!supabase) return () => {}

  const channel = supabase
    .channel('public:works')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: TABLE },
      handler,
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
