import { useEffect, useState } from 'react'
import AuthFormLogin from './component/AuthFormsLogin'
import AuthFormSignUp from './component/AuthFormsSignUp'
import './App.css'
import { getClientAuth, logout, refreshUser, resendVerification, watchUser } from './auth/firebase'
import { authError } from './auth/validation'
import Homepage from './pages/Homepage'

export default function App() {
  const [page, setPage] = useState('login')
  const [auth] = useState(() => {
    try { return getClientAuth() } catch { return null }
  })
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(auth))
  const [signingUp, setSigningUp] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!auth) return
    return watchUser(auth, user => {
      setUser(user ? { email: user.email, displayName: user.displayName, emailVerified: user.emailVerified } : null)
      setLoading(false)
    })
  }, [auth])

  async function accountAction(action) {
    if (busy) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      if (action === 'logout') {
        await logout()
        setPage('login')
      } else if (action === 'resend') {
        await resendVerification()
        setMessage('Verification email sent. Check your inbox.')
      } else {
        const updated = await refreshUser()
        setUser({ email: updated.email, displayName: updated.displayName, emailVerified: updated.emailVerified })
        if (!updated.emailVerified) setMessage('Your email is not verified yet. Open the link in your inbox, then try again.')
      }
    } catch (error) {
      setError(authError(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="app-container auth-page">
      {loading ? <p role="status">Loading…</p> : user && !signingUp ? (
        <section className="card signin-card" aria-busy={busy}>
          {user.emailVerified ? <Homepage user={user} /> : <>
            <h2>Verify your email</h2>
            <p>Open the verification link sent to {user.email} to finish signing up.</p>
            <button className="btn" disabled={busy} onClick={() => accountAction('refresh')}>I’ve verified my email</button>
            <button className="auth-link account-action" disabled={busy} onClick={() => accountAction('resend')}>Resend verification email</button>
          </>}
          {message && <p className="auth-message" role="status">{message}</p>}
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-link account-action" disabled={busy} onClick={() => accountAction('logout')}>Sign Out</button>
        </section>
      ) : page === 'login' ? (
        <AuthFormLogin onSignUp={() => setPage('signup')} />
      ) : (
        <AuthFormSignUp onSignIn={() => setPage('login')} onSignupStart={() => setSigningUp(true)} onSignupComplete={(message, createdUser) => {
          setMessage(message)
          if (createdUser) setUser({ email: createdUser.email, displayName: createdUser.displayName, emailVerified: createdUser.emailVerified })
          setSigningUp(false)
        }} />
      )}
    </main>
  )
}
