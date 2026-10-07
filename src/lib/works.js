import { supabase } from './supabase.js'
import { publicUrlFor, removeImages, uploadImages } from './images.js'
import { MOCK_ROWS, USE_MOCK_WORKS } from './mockWorks.js'
import {
  editorToJson,
  jsonImagePaths,
  mergeStory,
  normalizeStory,
  publicStory,
  splitStory,
} from './story.js'

const TABLE = 'works'

// Database rows use snake_case; the UI components keep the shape they already
// had (`link`, `images`), so presentation code did not need rewriting.
//
// Visitors' rows only ever contain public story steps (migration 0003 keeps
// hidden ones in an admin-only table). The admin editor passes `privateRow` to
// get the full story back. `publicStory` below is a second line of defence for
// databases that have not had 0003 applied yet.
function fromRow(row, { includeHidden = false, privateRow = null } = {}) {
  const paths = row.image_paths ?? []
  const json = includeHidden ? mergeStory(row.build_story, privateRow) : row.build_story
  const story = normalizeStory(json, publicUrlFor)

  return {
    id: row.id,
    title: row.title,
    category: row.category,
    description: row.description ?? '',
    link: row.project_url ?? '',
    imagePaths: paths,
    images: paths.map(publicUrlFor),
    embedKind: row.embed_kind ?? 'none',
    embedUrl: row.embed_url ?? '',
    tryHint: row.try_hint ?? '',
    tools: row.tools ?? [],
    buildStory: includeHidden ? story : publicStory(story),
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

// A save against a database that has not had migration 0002 applied fails
// with a cryptic column error; say what to do instead.
function explain(error) {
  const message = error?.message ?? ''
  if (
    error?.code === 'PGRST204' ||
    error?.code === '42703' ||
    /could not find the '.*' column|column .* does not exist/i.test(message)
  ) {
    return new Error(
      'The database is missing the stage columns. Run supabase/migrations/0002_stage_and_story.sql in the Supabase SQL editor, then try again.',
    )
  }
  return error
}

// The admin-only table from migration 0003. Until it exists there is simply
// nothing private to read; any other error must stop the admin from loading,
// because saving without the hidden steps would delete them.
const PRIVATE_TABLE = 'work_story_private'
const MISSING_TABLE = new Set(['42P01', 'PGRST205'])

async function fetchPrivateRows(client, workId) {
  let query = client.from(PRIVATE_TABLE).select('work_id, hidden_steps, layout, meta')
  if (workId) query = query.eq('work_id', workId)

  const { data, error } = await query
  if (error) {
    if (MISSING_TABLE.has(error.code)) return new Map()
    throw error
  }
  return new Map((data ?? []).map((row) => [row.work_id, row]))
}

// ---- Dev mock store ---------------------------------------------------------
// Only reachable when USE_MOCK_WORKS; keeps the admin usable without Supabase.
// It splits stories the way the database trigger does, so visitors' data never
// contains hidden steps here either.
let mockRows = []
const mockPrivate = new Map()

function storeMockStory(row) {
  const { publicStory: open, hiddenSteps, layout, meta } = splitStory(row.build_story)
  row.build_story = open
  if (hiddenSteps.length > 0) {
    mockPrivate.set(row.id, { work_id: row.id, hidden_steps: hiddenSteps, layout, meta })
  } else {
    mockPrivate.delete(row.id)
  }
  return row
}

mockRows = MOCK_ROWS.map((row) => storeMockStory({ ...row }))
const mockListeners = new Set()
const notifyMock = () => mockListeners.forEach((listener) => listener())

export async function listWorks({ includeHidden = false } = {}) {
  if (USE_MOCK_WORKS) {
    return [...mockRows]
      .sort((a, b) => a.display_order - b.display_order)
      .map((row) => fromRow(row, { includeHidden, privateRow: mockPrivate.get(row.id) }))
  }

  const client = requireClient()

  const { data, error } = await client
    .from(TABLE)
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error

  const privateRows = includeHidden ? await fetchPrivateRows(client) : new Map()
  return (data ?? []).map((row) =>
    fromRow(row, { includeHidden, privateRow: privateRows.get(row.id) }),
  )
}

async function nextDisplayOrder(client) {
  if (USE_MOCK_WORKS) {
    return Math.max(0, ...mockRows.map((row) => row.display_order)) + 1
  }

  const { data } = await client
    .from(TABLE)
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (data?.display_order ?? 0) + 1
}

// The columns added by migration 0002. `tools` is already an array here.
function stageColumns(fields, storyJson) {
  return {
    embed_kind: fields.embedKind || 'none',
    embed_url: fields.embedUrl?.trim() || null,
    try_hint: fields.tryHint?.trim() || null,
    tools: fields.tools ?? [],
    build_story: storyJson,
  }
}

/**
 * Uploads the images picked for story steps (one batch) and returns the story
 * as stored JSON plus the paths that were added, so a failed save can remove
 * them again.
 */
async function uploadStory(workId, editorStory, onProgress) {
  if (!editorStory) return { json: null, addedPaths: [] }

  const files = editorStory.steps.filter((step) => step.file).map((step) => step.file)
  const addedPaths = files.length > 0 ? await uploadImages(workId, files, onProgress) : []
  return { json: editorToJson(editorStory, addedPaths), addedPaths }
}

/**
 * Images are uploaded before the row is written. If the insert fails the
 * uploads are removed again, so a failed save never leaves files behind.
 */
export async function createWork(fields, files, onProgress) {
  const client = USE_MOCK_WORKS ? null : requireClient()
  const id = fields.id ?? newWorkId()

  const paths = files.length > 0 ? await uploadImages(id, files, onProgress) : []

  let story
  try {
    story = await uploadStory(id, fields.buildStory, onProgress)
  } catch (error) {
    await removeImages(paths).catch(() => {})
    throw error
  }

  const row = {
    id,
    title: fields.title,
    category: fields.category,
    description: fields.description ?? '',
    project_url: fields.link || null,
    image_paths: paths,
    display_order: fields.displayOrder ?? (await nextDisplayOrder(client)),
    legacy_id: fields.legacyId ?? null,
    ...stageColumns(fields, story.json),
  }

  if (USE_MOCK_WORKS) {
    const saved = storeMockStory({
      published: true,
      created_at: new Date().toISOString(),
      ...row,
    })
    mockRows = [...mockRows, saved]
    notifyMock()
    return fromRow(saved, { includeHidden: true, privateRow: mockPrivate.get(id) })
  }

  const { data, error } = await client
    .from(TABLE)
    .insert(row)
    .select()
    .single()

  if (error) {
    await removeImages([...paths, ...story.addedPaths]).catch(() => {})
    throw explain(error)
  }

  return fromRow(data, { includeHidden: true })
}

/**
 * Order matters: new files go up first, then the row is updated with the full
 * ordered path list, and only once the database confirms are the removed
 * images deleted from storage. A failure at any step leaves the previous
 * images intact.
 */
export async function updateWork(id, fields, keptPaths, files, onProgress) {
  const client = USE_MOCK_WORKS ? null : requireClient()

  const addedPaths =
    files.length > 0 ? await uploadImages(id, files, onProgress) : []
  const finalPaths = [...keptPaths, ...addedPaths]

  let story
  try {
    story = await uploadStory(id, fields.buildStory, onProgress)
  } catch (error) {
    await removeImages(addedPaths).catch(() => {})
    throw error
  }

  const patch = {
    title: fields.title,
    category: fields.category,
    description: fields.description ?? '',
    project_url: fields.link || null,
    image_paths: finalPaths,
    ...stageColumns(fields, story.json),
  }

  let saved
  if (USE_MOCK_WORKS) {
    mockRows = mockRows.map((row) =>
      row.id === id ? storeMockStory({ ...row, ...patch }) : row,
    )
    saved = mockRows.find((row) => row.id === id)
    notifyMock()
  } else {
    const { data, error } = await client
      .from(TABLE)
      .update(patch)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      await removeImages([...addedPaths, ...story.addedPaths]).catch(() => {})
      throw explain(error)
    }
    saved = data
  }

  const finalStoryPaths = jsonImagePaths(story.json)
  const removed = [
    ...(fields.previousPaths ?? []).filter((path) => !finalPaths.includes(path)),
    ...(fields.previousStoryPaths ?? []).filter((path) => !finalStoryPaths.includes(path)),
  ]
  if (removed.length > 0) {
    await removeImages(removed).catch(() => {})
  }

  // `saved` is the stored row, so it holds public steps only; the admin form
  // reloads the full story through listWorks.
  return fromRow(saved, { includeHidden: true, privateRow: USE_MOCK_WORKS ? mockPrivate.get(id) : null })
}

export async function deleteWork(id) {
  if (USE_MOCK_WORKS) {
    mockPrivate.delete(id)
    mockRows = mockRows.filter((row) => row.id !== id)
    notifyMock()
    return
  }

  const client = requireClient()

  // select('*') so this still works on a database without migration 0002.
  const { data: existing, error: lookupError } = await client
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (lookupError) throw lookupError

  // Images of hidden steps are only listed in the admin-only row, which the
  // delete below cascades away, so read it first.
  const privateRow = (await fetchPrivateRows(client, id)).get(id)

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
  const paths = [
    ...(existing?.image_paths ?? []),
    ...jsonImagePaths(existing?.build_story),
    ...jsonImagePaths({ steps: privateRow?.hidden_steps }),
  ]
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
  if (USE_MOCK_WORKS) {
    mockListeners.add(handler)
    return () => mockListeners.delete(handler)
  }
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
