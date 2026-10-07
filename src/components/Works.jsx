import { useCallback, useEffect, useRef, useState } from 'react'
import './Works.css'
import WorkCard from './WorkCard.jsx'
import { deleteWork, listWorks, subscribeToWorks } from '../lib/works.js'
import { computeSpans, variantFor } from '../lib/layout.js'
import { subscribeToEditRequests } from '../lib/editBus.js'
import { isSupabaseConfigured } from '../lib/supabase.js'
import { USE_MOCK_WORKS } from '../lib/mockWorks.js'
import Stage from './Stage.jsx'
import { useHashRoute } from '../hooks.js'
import { setWorkHash, workIdFromHash } from '../lib/stage.js'

// Mock data stands in for Supabase in `npm run dev` when it is not configured.
const hasSource = isSupabaseConfigured || USE_MOCK_WORKS

const filters = ['All', 'Code', 'Other', 'Achievements']
const categoryPriority = { Code: 0, Other: 1, Achievements: 2 }

function Works({ isAdmin = false }) {
  // null means "still loading"; without Supabase there is nothing to load.
  const [works, setWorks] = useState(() => (hasSource ? null : []))
  const [filter, setFilter] = useState('All')
  const [editingId, setEditingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const route = useHashRoute()
  const hashId = workIdFromHash(route)
  const handledDeepLink = useRef(false)

  // Promise chain rather than async/await: setState lands in a callback, not
  // synchronously in the effect body.
  const load = useCallback(
    () =>
      listWorks({ includeHidden: isAdmin })
        .then((rows) => {
          setWorks(rows)
          setError('')

          // A direct #/work/<id> link: make sure its category is showing and
          // bring the stage into view, once.
          if (!handledDeepLink.current) {
            handledDeepLink.current = true
            const linked = rows.find((row) => row.id === workIdFromHash())
            if (linked) {
              setFilter('All')
              requestAnimationFrame(() =>
                document.getElementById('stage')?.scrollIntoView(),
              )
            }
          }
        })
        .catch((loadError) => {
          setError(loadError.message || 'Could not load projects.')
          setWorks((current) => current ?? [])
        }),
    [isAdmin],
  )

  useEffect(() => {
    if (!hasSource) return

    load()

    // Any change from any browser reloads the list, so a project added
    // elsewhere shows up here without a refresh.
    const unsubscribe = subscribeToWorks(load)
    return unsubscribe
  }, [load])

  useEffect(
    () => subscribeToEditRequests((work) => setEditingId(work?.id ?? null)),
    [],
  )

  async function handleDelete(work) {
    const confirmed = window.confirm(
      `Delete “${work.title}”? This removes the project and its uploaded images.`,
    )
    if (!confirmed) return

    setDeletingId(work.id)
    setError('')
    setNotice('')

    try {
      await deleteWork(work.id)
      setWorks((current) =>
        current ? current.filter((item) => item.id !== work.id) : current,
      )
      if (editingId === work.id) setEditingId(null)
      setNotice(`“${work.title}” was deleted.`)
    } catch (deleteError) {
      setError(deleteError.message || 'Could not delete that project.')
    } finally {
      setDeletingId(null)
    }
  }

  // Switching category keeps a valid channel selected and the URL honest.
  function handleFilter(name) {
    setFilter(name)
    if (isAdmin || !hashId) return
    const next = (works ?? []).filter((w) => name === 'All' || w.category === name)
    if (next.length > 0 && !next.some((w) => w.id === hashId)) setWorkHash(next[0].id)
  }

  const isLoading = works === null
  const visibleWorks = (filter === 'All'
    ? [...(works ?? [])]
    : (works ?? []).filter((work) => work.category === filter)
  ).sort((a, b) => {
    // Only the admin grid is grouped by category; the stage follows display_order.
    if (filter !== 'All' || !isAdmin) return 0
    return (
      (categoryPriority[a.category] ?? 99) -
      (categoryPriority[b.category] ?? 99)
    )
  })

  function renderBody() {
    if (!hasSource) {
      return (
        <p className="works-message">
          Supabase is not configured yet, so there are no projects to show.
        </p>
      )
    }

    if (isLoading) {
      // Placeholder cards keep the grid height stable while loading.
      return (
        <ul className="works-grid" aria-hidden="true">
          {[8, 4, 12].map((span, key) => (
            <li
              key={key}
              className="works-card works-card-skeleton"
              data-span={span}
              style={{ '--span': span }}
            >
              <div className="works-skeleton-media" />
              <div className="works-skeleton-line" />
              <div className="works-skeleton-line is-short" />
            </li>
          ))}
        </ul>
      )
    }

    if (visibleWorks.length === 0) {
      return (
        <p className="works-message">
          {works.length === 0
            ? 'No projects published yet.'
            : 'No projects in this category yet.'}
        </p>
      )
    }

    if (!isAdmin) {
      const selected = visibleWorks.find((work) => work.id === hashId) ?? visibleWorks[0]
      return (
        <Stage
          works={visibleWorks}
          selectedId={selected.id}
          onSelect={setWorkHash}
        />
      )
    }

    const spans = computeSpans(visibleWorks.length)

    return (
      /* Keyed on the filter so switching categories replays the entrance. */
      <ul className="works-grid" key={filter}>
        {visibleWorks.map((work, position) => (
          <WorkCard
            key={work.id}
            work={work}
            position={position}
            span={spans[position]}
            variant={variantFor(work, position, spans[position])}
            isBeingEdited={work.id === editingId}
            isDeleting={work.id === deletingId}
            isAdmin={isAdmin}
            onDelete={handleDelete}
          />
        ))}
      </ul>
    )
  }

  return (
    <section className={`works section${isAdmin ? ' is-admin' : ''}`} id="stage">
      <div className="shell">
        <div className="works-head">
          <div>
            <p className="eyebrow">Live stage</p>
            <h2 className="section-title">Pick a channel.</h2>
          </div>

          <div
            className="works-filters"
            role="group"
            aria-label="Filter projects by category"
          >
            {filters.map((name) => (
              <button
                key={name}
                type="button"
                className={
                  name === filter ? 'works-filter is-active' : 'works-filter'
                }
                aria-pressed={name === filter}
                onClick={() => handleFilter(name)}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
        {error && (
          <p className="works-message" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="works-message is-success" role="status">
            {notice}
          </p>
        )}
        {renderBody()}
      </div>
    </section>
  )
}

export default Works
