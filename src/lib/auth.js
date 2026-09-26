import { supabase } from './supabase.js'

export async function getSession() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session ?? null
}

export async function signIn(email, password) {
  if (!supabase) throw new Error('Supabase is not configured.')

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data.session
}

export async function signOut() {
  if (!supabase) return
  await supabase.auth.signOut()
}

// Fires on sign-in, sign-out, token refresh and expiry, so an expired session
// drops the admin UI back to the login form on its own.
export function onAuthChange(handler) {
  if (!supabase) return () => {}

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    handler(session ?? null)
  })
  return () => data.subscription.unsubscribe()
}

// Write access needs a row in admin_users, not merely a session.
export async function checkIsAdmin(session) {
  if (!supabase || !session) return false

  const { data, error } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', session.user.id)
    .maybeSingle()

  if (error) return false
  return Boolean(data)
}
