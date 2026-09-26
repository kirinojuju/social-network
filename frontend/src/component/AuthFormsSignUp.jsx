import { useState } from 'react'
import { authActions } from '../auth/firebase'
import { authError, validateSignup } from '../auth/validation'
import './AuthStyle.css'

export default function AuthFormSignUp({ onSignIn, onSignupStart, onSignupComplete }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    if (busy) return
    const values = Object.fromEntries(new FormData(event.currentTarget))
    const validationError = validateSignup(values)
    if (validationError) return setError(validationError)
    setError('')
    setBusy(true)
    onSignupStart()
    try {
      const result = await authActions.signup(values)
      onSignupComplete(result.message, result.user)
    } catch (error) {
      setError(authError(error))
      onSignupComplete('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card signup-card" id="signup">
      <h2>Welcome to CMU Connect</h2>
      <form onSubmit={submit} aria-busy={busy}>
        <fieldset className="auth-fields" disabled={busy}>
          <div className="form-row">
            <div className="form-group">
              <input name="firstName" type="text" placeholder="First Name" aria-label="First Name" autoComplete="given-name" maxLength={50} required />
            </div>
            <div className="form-group">
              <input name="lastName" type="text" placeholder="Last Name" aria-label="Last Name" autoComplete="family-name" maxLength={49} required />
            </div>
          </div>
          <div className="form-group">
            <input name="email" type="email" placeholder="CMU Email" aria-label="CMU Email" autoComplete="email" required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <input name="password" type="password" placeholder="Password" aria-label="Password" autoComplete="new-password" minLength={6} required />
            </div>
            <div className="form-group">
              <input name="confirmPassword" type="password" placeholder="Confirm Password" aria-label="Confirm Password" autoComplete="new-password" minLength={6} required />
            </div>
          </div>
          <p className="footer-text">Use at least 6 characters. Your account will be ready immediately.</p>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="btn btn-signup" type="submit">{busy ? 'Creating account…' : 'Create Account'}</button>
          <div className="footer-text">
            Already have an account?{' '}
            <button className="auth-link" type="button" onClick={onSignIn}>Sign In</button>
          </div>
        </fieldset>
      </form>
    </div>
  )
}
