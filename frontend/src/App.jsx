import { useEffect, useState } from 'react'
import AuthFormLogin from './component/AuthFormsLogin'
import AuthFormSignUp from './component/AuthFormsSignUp'
import LeftSidebar from './component/LeftSideBar'
import RightSideBar from './component/RightSideBar'
import Explore from './component/Explore'
import MiddlePage from './component/MiddlePage'
import AISummary from './component/AI_summary'
import Chatbox from './component/Chatbox'
import Profile from './pages/Profile/Profile'
import { getClientAuth, logout, watchUser } from './auth/firebase'
import { profileClient } from './auth/profile'
import { saveFirestoreProfile } from './auth/firestore-profile'
import { authError } from './auth/validation'
import './App.css'

export default function App() {
  const [page, setPage] = useState('login')
  const [activeView, setActiveView] = useState('home')
  const [summaryPost, setSummaryPost] = useState(null)
  const [showChat, setShowChat] = useState(false)
  const [auth] = useState(() => {
    try { return getClientAuth() } catch { return null }
  })
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(auth))
  const [signingUp, setSigningUp] = useState(false)
  const [busy, setBusy] = useState(false)
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
      if (!nextUser) {
        setActiveView('home')
        setSummaryPost(null)
        setShowChat(false)
      }
    })
  }, [auth])

  useEffect(() => {
    if (!user || signingUp) return
    let active = true
    profileClient.load(user).then(result => result || profileClient.ensure(user))
      .then(async result => { await saveFirestoreProfile(user, result); return result })
      .then(result => {
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

  async function signOut() {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await logout()
      setPage('login')
    } catch (failure) {
      setError(authError(failure))
    } finally {
      setBusy(false)
    }
  }

  function focusComposer() {
    setActiveView('home')
    requestAnimationFrame(() => document.getElementById('post-content')?.focus())
  }

  if (loading) return <main className="app-container auth-page"><p role="status">Loading…</p></main>

  if (user && !signingUp) {
    if (profileState !== 'ready') return (
      <main className="app-container auth-page">
        <section className="card signin-card app-status" aria-busy={busy}>
          {profileState === 'error' ? <>
            <h2>Profile unavailable</h2>
            <p className="auth-error" role="alert">{profileError}</p>
            <button className="btn" disabled={busy} onClick={() => {
              setProfileState('loading')
              setProfileError('')
              setSessionVersion(version => version + 1)
            }}>Try again</button>
          </> : <p role="status">Loading your profile…</p>}
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-link account-action" disabled={busy} onClick={signOut}>Sign Out</button>
        </section>
      </main>
    )

    return (
      <div className={`app ${activeView === 'home' ? 'has-right-sidebar' : ''}`}>
        <LeftSidebar activeView={activeView} onNavigate={setActiveView}
          onCreatePost={focusComposer} onOpenAI={() => setSummaryPost('')}
          onOpenMessages={() => setShowChat(true)} />
        <div className={`app-main ${activeView === 'home' ? 'with-right-sidebar' : ''}`}>
          <div className="account-bar">
            <span>Signed in as {profile.display_name} (@{profile.username})</span>
            <div className="account-actions">
              <button className="auth-link account-action" onClick={() => setActiveView('profile')}>My Profile</button>
              <button className="auth-link account-action" disabled={busy} onClick={signOut}>Sign Out</button>
            </div>
          </div>
          {error && <p className="auth-error" role="alert">{error}</p>}
          {activeView === 'explore' ? <Explore />
            : activeView === 'profile' ? <Profile profile={profile} />
              : <MiddlePage profile={profile} user={user} onSummarize={setSummaryPost} />}
        </div>
        {activeView === 'home' && <RightSideBar />}
        {showChat && <Chatbox userName="Message preview" onClose={() => setShowChat(false)} />}
        {summaryPost !== null && <AISummary postText={summaryPost} onClose={() => setSummaryPost(null)} />}
      </div>
    )
  }

  return (
    <main className="app-container auth-page">
      {page === 'login' ? <AuthFormLogin onSignUp={() => setPage('signup')} /> : (
        <AuthFormSignUp onSignIn={() => setPage('login')}
          onSignupStart={() => setSigningUp(true)}
          onSignupComplete={(_, createdUser) => {
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
