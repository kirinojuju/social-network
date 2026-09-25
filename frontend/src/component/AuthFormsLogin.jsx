import { useState } from 'react'
import { authActions, login } from '../auth/firebase'
import { authError } from '../auth/validation'
import './AuthStyle.css'

export default function AuthFormLogin({ onSignUp }) {
  const [busy, setBusy] = useState(false)
  const [reset, setReset] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function submit(event) {
    event.preventDefault()
    if (busy) return
    const values = Object.fromEntries(new FormData(event.currentTarget))
    setBusy(true)
    setError('')
    setMessage('')
    try {
      if (reset) setMessage(await authActions.resetPassword(values.email))
      else await login(values.email, values.password)
    } catch (error) {
      setError(authError(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card signin-card" id="signin">
      <h2>{reset ? 'Reset Password' : 'Welcome Back'}</h2>
      <form className="signin-inner" onSubmit={submit} aria-busy={busy}>
        <fieldset className="auth-fields" disabled={busy}>
          <div className="form-group">
            <input name="email" type="email" placeholder="CMU Email" aria-label="CMU Email" autoComplete="email" required />
          </div>
          {!reset && <div className="form-group">
            <input name="password" type="password" placeholder="Password" aria-label="Password" autoComplete="current-password" required />
          </div>}
          {error && <p className="auth-error" role="alert">{error}</p>}
          {message && <p className="auth-message" role="status">{message}</p>}
          <button className="btn" type="submit" style={{ marginTop: '15px' }}>
            {busy ? 'Please wait…' : reset ? 'Send Reset Link' : 'Login'}
          </button>
          <button type="button" className="auth-link forgot-password" onClick={() => {
            setReset(!reset)
            setError('')
            setMessage('')
          }}>
            {reset ? 'Back to sign in' : 'Forgot password?'}
          </button>
          <div className="footer-text">
            New to CMU Connect?{' '}
            <button className="auth-link" type="button" onClick={onSignUp}>Create an account</button>
          </div>
        </fieldset>
      </form>
    </div>
  )
}
