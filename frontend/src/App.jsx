import { useEffect, useState } from 'react'
import AuthFormLogin from './component/AuthFormsLogin'
import AuthFormSignUp from './component/AuthFormsSignUp'
import { getClientAuth, logout, watchUser } from './auth/firebase'
import { profileClient } from './auth/profile'
import { saveFirestoreProfile } from './auth/firestore-profile'
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
      setProfileState(nextUser ? 'loading' : 'idle')
      setProfileError('')
      setLoading(false)
    })
  }, [auth])

  useEffect(() => {
    if (!user || signingUp) return
    let active = true
    profileClient.load(user).then(result => result || profileClient.ensure(user))
      .then(async result => { await saveFirestoreProfile(user, result); return result }).then(result => {
      if (!active) return
      setProfile(result)
      setProfileState('ready')
    }).catch(profileFailure => {
      if (!active) return
      setProfileError(profileFailure.message)
      setProfileState('error')
    })
    return () => { active = false }
  }, [user, signingUp, sessionVersion])

  async function accountAction(action) {
    if (busy) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      if (action === 'logout') {
        await logout()
        setPage('login')
      }
    } catch (authFailure) {
      setError(authError(authFailure))
    } finally {
      setBusy(false)
    }
  }

  function signedInContent() {
    if (profileState === 'loading' || profileState === 'idle') return <p role="status">Loading your profile…</p>
    if (profileState === 'error') return <>
      <h2>Profile unavailable</h2>
      <p className="auth-error" role="alert">{profileError}</p>
      <button className="btn" disabled={busy} onClick={() => {
        setProfileState('loading')
        setProfileError('')
        setSessionVersion(version => version + 1)
      }}>Try again</button>
    </>
    return <Homepage profile={profile} user={user} />
  }

  return (
    <main className="app-container auth-page">
      {loading ? <p role="status">Loading…</p> : user && !signingUp ? (
        <section className={`card ${profileState === 'ready' ? 'feed-card' : 'signin-card'}`} aria-busy={busy}>
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
            setProfileState('loading')
            setProfileError('')
          }
          setSigningUp(false)
        }} />
      )}
    </main>
  )
}
