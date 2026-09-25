import { useEffect, useState } from 'react'
import AuthFormLogin from './component/AuthFormsLogin'
import AuthFormSignUp from './component/AuthFormsSignUp'
import ProfileOnboarding from './component/ProfileOnboarding'
import { getClientAuth, logout, refreshUser, resendVerification, watchUser } from './auth/firebase'
import { profileClient } from './auth/profile'
import { authError } from './auth/validation'
import Homepage from './pages/Homepage'
import './App.css'

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
  const [profile, setProfile] = useState(null)
  const [profileState, setProfileState] = useState('idle')
  const [profileError, setProfileError] = useState('')
  const [sessionVersion, setSessionVersion] = useState(0)

  useEffect(() => {
    if (!auth) return
    return watchUser(auth, nextUser => {
      setUser(nextUser)
      setProfile(null)
      setProfileState(nextUser?.emailVerified ? 'loading' : 'idle')
      setProfileError('')
      setLoading(false)
    })
  }, [auth])

  useEffect(() => {
    if (!user?.emailVerified || signingUp) return
    let active = true
    profileClient.load(user).then(result => {
      if (!active) return
      setProfile(result)
      setProfileState(result ? 'ready' : 'onboarding')
    }).catch(profileFailure => {
      if (!active) return
      setProfileError(profileFailure.message)
      setProfileState('error')
    })
    return () => { active = false }
  }, [user, signingUp, sessionVersion])

  async function saveProfile(values) {
    if (busy || !user) return
    setBusy(true)
    setProfileError('')
    try {
      const saved = await profileClient.syncAndRead(user, values)
      if (auth.currentUser?.uid === user.uid) {
        setProfile(saved)
        setProfileState('ready')
      }
    } catch (profileFailure) {
      setProfileError(profileFailure.message)
    } finally {
      setBusy(false)
    }
  }

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
        setUser(updated)
        if (updated.emailVerified) {
          setProfileState('loading')
          setProfileError('')
        }
        setSessionVersion(version => version + 1)
        if (!updated.emailVerified) setMessage('Your email is not verified yet. Open the link in your inbox, then try again.')
      }
    } catch (authFailure) {
      setError(authError(authFailure))
    } finally {
      setBusy(false)
    }
  }

  function signedInContent() {
    if (!user.emailVerified) return <>
      <h2>Verify your email</h2>
      <p>Open the verification link sent to {user.email} to finish signing up.</p>
      <button className="btn" disabled={busy} onClick={() => accountAction('refresh')}>I've verified my email</button>
      <button className="auth-link account-action" disabled={busy} onClick={() => accountAction('resend')}>Resend verification email</button>
    </>
    if (profileState === 'loading' || profileState === 'idle') return <p role="status">Loading your profile…</p>
    if (profileState === 'onboarding') return <ProfileOnboarding user={user} busy={busy} error={profileError} onSave={saveProfile} />
    if (profileState === 'error') return <>
      <h2>Profile unavailable</h2>
      <p className="auth-error" role="alert">{profileError}</p>
      <button className="btn" disabled={busy} onClick={() => {
        setProfileState('loading')
        setProfileError('')
        setSessionVersion(version => version + 1)
      }}>Try again</button>
    </>
    return <Homepage profile={profile} />
  }

  return (
    <main className="app-container auth-page">
      {loading ? <p role="status">Loading…</p> : user && !signingUp ? (
        <section className="card signin-card" aria-busy={busy}>
          {signedInContent()}
          {message && <p className="auth-message" role="status">{message}</p>}
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-link account-action" disabled={busy} onClick={() => accountAction('logout')}>Sign Out</button>
        </section>
      ) : page === 'login' ? (
        <AuthFormLogin onSignUp={() => setPage('signup')} />
      ) : (
        <AuthFormSignUp onSignIn={() => setPage('login')} onSignupStart={() => setSigningUp(true)} onSignupComplete={(signupMessage, createdUser) => {
          setMessage(signupMessage)
          if (createdUser) {
            setUser(createdUser)
            setProfileState(createdUser.emailVerified ? 'loading' : 'idle')
            setProfileError('')
          }
          setSigningUp(false)
        }} />
      )}
    </main>
  )
}
