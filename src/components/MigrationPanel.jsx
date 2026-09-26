import { useEffect, useState } from 'react'
import { importLegacyWorks, inspectLegacyWorks } from '../lib/migration.js'

function MigrationPanel() {
  const [scan, setScan] = useState(null)
  const [progress, setProgress] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    inspectLegacyWorks()
      .then((found) => {
        if (active) setScan(found)
      })
      .catch(() => {
        if (active) setError('Could not read this browser’s local projects.')
      })

    return () => {
      active = false
    }
  }, [])

  async function handleImport() {
    if (!scan || scan.importable.length === 0) return

    setError('')
    setResult(null)

    try {
      const outcome = await importLegacyWorks(scan.importable, setProgress)
      setResult(outcome)
      setScan(await inspectLegacyWorks())
    } catch (importError) {
      setError(importError.message || 'Import failed.')
    } finally {
      setProgress(null)
    }
  }

  if (!scan && !error) {
    return <p className="admin-note">Checking this browser for local projects...</p>
  }

  const total = scan?.works.length ?? 0
  const pending = scan?.importable.length ?? 0

  return (
    <div className="admin-migration">
      <h3 className="admin-subheading">Import from this browser</h3>

      {total === 0 ? (
        <p className="admin-note">
          No projects found in this browser&rsquo;s local database.
        </p>
      ) : (
        <p className="admin-note">
          Found {total} local project{total === 1 ? '' : 's'} in this browser.{' '}
          {pending > 0
            ? `${pending} not yet in Supabase.`
            : 'All of them are already imported.'}
        </p>
      )}

      {pending > 0 && (
        <button
          type="button"
          className="add-work-submit"
          onClick={handleImport}
          disabled={Boolean(progress)}
        >
          {progress
            ? `Importing ${progress.done + 1} of ${progress.total}...`
            : `Import ${pending} project${pending === 1 ? '' : 's'}`}
        </button>
      )}

      {result && (
        <div className="admin-note" role="status">
          <p>Imported {result.imported.length} project(s).</p>
          {result.failed.length > 0 && (
            <ul className="admin-failures">
              {result.failed.map((failure) => (
                <li key={failure.title}>
                  {failure.title}: {failure.message}
                </li>
              ))}
            </ul>
          )}
          <p>
            Your local copy was left untouched. Open the site in another browser
            to confirm the imported projects are there.
          </p>
        </div>
      )}

      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export default MigrationPanel
