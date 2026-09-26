// Read-only access to the old browser-local store. Supabase is now the source
// of truth; this file exists purely so the admin can import what an individual
// browser still holds. Nothing here writes or deletes.

const DB_NAME = 'portfolio'
const WORKS_STORE = 'works'

function toPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Opens without a version so it never triggers an upgrade; if this browser has
// no such database, an empty store is reported rather than one being created.
function openExisting() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null)
      return
    }

    const request = indexedDB.open(DB_NAME)
    request.onsuccess = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(WORKS_STORE)) {
        db.close()
        resolve(null)
        return
      }
      resolve(db)
    }
    request.onerror = () => reject(request.error)
  })
}

export async function readLegacyWorks() {
  try {
    const db = await openExisting()
    if (!db) return []

    const transaction = db.transaction(WORKS_STORE, 'readonly')
    const rows = await toPromise(transaction.objectStore(WORKS_STORE).getAll())
    db.close()

    return (rows ?? []).map((row) => ({
      ...row,
      images: Array.isArray(row.images)
        ? row.images
        : row.image
          ? [row.image]
          : [],
    }))
  } catch {
    return []
  }
}
