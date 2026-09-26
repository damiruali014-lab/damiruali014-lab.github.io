import { useState } from 'react'
import { signIn } from '../lib/auth.js'

function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isBusy, setIsBusy] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setIsBusy(true)
    setError('')

    try {
      await signIn(email, password)
    } catch (signInError) {
      setError(signInError.message || 'Could not sign in.')
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <form className="admin-login" onSubmit={handleSubmit}>
      <div className="add-work-field">
        <label className="add-work-label" htmlFor="admin-email">
          Email
        </label>
        <input
          id="admin-email"
          className="add-work-input"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <div className="add-work-field">
        <label className="add-work-label" htmlFor="admin-password">
          Password
        </label>
        <input
          id="admin-password"
          className="add-work-input"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>
      <button type="submit" className="add-work-submit" disabled={isBusy}>
        {isBusy ? 'Signing in...' : 'Sign in'}
      </button>
      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}

export default AdminLogin
