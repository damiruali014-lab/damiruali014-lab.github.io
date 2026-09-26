import './Admin.css'
import AddWorkForm from './AddWorkForm.jsx'
import AdminLogin from './AdminLogin.jsx'
import MigrationPanel from './MigrationPanel.jsx'
import { signOut } from '../lib/auth.js'
import { isSupabaseConfigured } from '../lib/supabase.js'

function AdminPanel({ status, session, isAdmin }) {
  if (!isSupabaseConfigured) {
    return (
      <section className="admin">
        <h2 className="admin-heading">Admin</h2>
        <p className="admin-error" role="alert">
          Supabase is not configured. Add VITE_SUPABASE_URL and
          VITE_SUPABASE_ANON_KEY to your .env file and restart the dev server.
        </p>
      </section>
    )
  }

  if (status === 'loading') {
    return (
      <section className="admin">
        <h2 className="admin-heading">Admin</h2>
        <p className="admin-note">Checking your session...</p>
      </section>
    )
  }

  if (!session) {
    return (
      <section className="admin">
        <h2 className="admin-heading">Admin</h2>
        <p className="admin-note">Sign in to manage projects.</p>
        <AdminLogin />
        <p className="admin-back">
          <a href="#/">Back to the site</a>
        </p>
      </section>
    )
  }

  if (!isAdmin) {
    return (
      <section className="admin">
        <h2 className="admin-heading">Admin</h2>
        <p className="admin-error" role="alert">
          {session.user.email} is signed in but is not on the admin allow-list.
          Add this account&rsquo;s user id to the admin_users table.
        </p>
        <button type="button" className="add-work-cancel" onClick={signOut}>
          Sign out
        </button>
      </section>
    )
  }

  return (
    <section className="admin">
      <div className="admin-bar">
        <h2 className="admin-heading">Admin</h2>
        <div className="admin-bar-actions">
          <a className="admin-back-link" href="#/">
            View site
          </a>
          <button type="button" className="add-work-cancel" onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>
      <p className="admin-note">Signed in as {session.user.email}.</p>

      <AddWorkForm />
      <MigrationPanel />
    </section>
  )
}

export default AdminPanel
