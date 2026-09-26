const EDIT_EVENT = 'work-edit'

export function requestEdit(work) {
  window.dispatchEvent(new CustomEvent(EDIT_EVENT, { detail: work }))
}

export function subscribeToEditRequests(handler) {
  function onEdit(event) {
    handler(event.detail)
  }

  window.addEventListener(EDIT_EVENT, onEdit)
  return () => window.removeEventListener(EDIT_EVENT, onEdit)
}
