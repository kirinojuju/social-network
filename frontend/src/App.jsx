import { useCallback, useEffect, useState } from 'react'
import AuthFormLogin from './component/AuthFormsLogin'
import AuthFormSignUp from './component/AuthFormsSignUp'
import LeftSidebar from './component/LeftSideBar'
import RightSideBar from './component/RightSideBar'
import Explore from './component/Explore'
import SearchResults from './component/SearchResults'
import MiddlePage from './component/MiddlePage'
import AISummary from './component/AI_summary'
import Chatbox from './component/Chatbox'
import Profile from './pages/Profile/Profile'
import { getClientAuth, logout, watchUser } from './auth/firebase'
import { profileClient } from './auth/profile'
import { saveFirestoreProfile } from './auth/firestore-profile'
import { authError } from './auth/validation'
import './App.css'
import TopBar from './component/Top_bar'
import { useAutoRefresh } from './live/useAutoRefresh'
import { addRecentSearch, loadRecentSearches, saveRecentSearches } from './search/recent'

export default function App() {
  const [page, setPage] = useState('login')
  const [activeView, setActiveView] = useState('home')
  const [exploreOpen, setExploreOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [submittedSearch, setSubmittedSearch] = useState('')
  const [recentSearches, setRecentSearches] = useState([])
  const [summaryPost, setSummaryPost] = useState(null)
  const [chatTarget, setChatTarget] = useState(null)
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
  const [people, setPeople] = useState([])
  const [peopleLoading, setPeopleLoading] = useState(false)
  const [peopleError, setPeopleError] = useState('')

  useEffect(() => {
    if (!auth) return
    return watchUser(auth, nextUser => {
      setUser(nextUser)
      setPeopleLoading(Boolean(nextUser))
      setPeopleError('')
      setProfile(null)
      setProfileState(nextUser ? 'loading' : 'idle')
      setProfileError('')
      setLoading(false)
      setExploreOpen(false)
      setSearchQuery('')
      setSubmittedSearch('')
      setRecentSearches(nextUser ? loadRecentSearches(nextUser.uid) : [])
      if (!nextUser) {
        setPeople([])
        setActiveView('home')
        setSummaryPost(null)
        setChatTarget(null)
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

  useEffect(() => {
    if (!user || profileState !== 'ready') return
    let active = true
    profileClient.listPeople(user).then(items => {
      if (active) setPeople(items)
    }).catch(() => {
      if (active) setPeopleError('Could not load people. Try again.')
    }).finally(() => {
      if (active) setPeopleLoading(false)
    })
    return () => { active = false }
  }, [user, profileState])

  async function refreshPeople() {
    if (!user || peopleLoading) return
    setPeopleLoading(true)
    setPeopleError('')
    try { setPeople(await profileClient.listPeople(user)) }
    catch { setPeopleError('Could not load people. Try again.') }
    finally { setPeopleLoading(false) }
  }

  useAutoRefresh(async signal => {
    if (!user || peopleLoading) return
    const items = await profileClient.listPeople(user, { signal })
    if (!signal.aborted) {
      setPeople(items)
      setPeopleError('')
    }
  }, 30000, Boolean(user) && profileState === 'ready')

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

  const closeExplore = useCallback(() => setExploreOpen(false), [])

  function updateRecentSearches(items) {
    setRecentSearches(items)
    if (user) saveRecentSearches(user.uid, items)
  }

  function recordSearch(term) {
    updateRecentSearches(addRecentSearch(recentSearches, term))
  }

  function runSearch(text) {
    const term = text.trim()
    if (!term) return
    setSearchQuery(term)
    setSubmittedSearch(term)
    setActiveView('search')
    setExploreOpen(false)
    recordSearch(term)
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
  <div className="app">

    <LeftSidebar
      activeView={activeView}
      onNavigate={setActiveView}
      onCreatePost={focusComposer}
      onOpenAI={() => setSummaryPost('')}
      onOpenMessages={() =>
        setChatTarget({ name: 'Message preview' })
      }
      onOpenExplore={() => setExploreOpen(true)}
    />

   <TopBar
  onOpenProfile={() => setActiveView('profile')}
  onOpenExplore={() => setExploreOpen(true)}
  searchQuery={searchQuery}
  onSearchChange={setSearchQuery}
  onSearchSubmit={runSearch}
/>

<main className="app-main">

  {error && (
    <p className="auth-error" role="alert">
      {error}
    </p>
  )}

  {activeView === 'profile' ? (
    <Profile
      profile={profile}
      onMessage={setChatTarget}
      onSignOut={signOut}
      signOutBusy={busy}
    />
  ) : activeView === 'search' ? (
    <SearchResults user={user} query={submittedSearch} />
  ) : (
    <MiddlePage
      key={user.uid}
      user={user}
      people={people}
      peopleLoading={peopleLoading}
      peopleError={peopleError}
      onRefreshPeople={refreshPeople}
    />
  )}

</main>

{/* Search popup */}
{exploreOpen && (
  <Explore
    query={searchQuery}
    recentSearches={recentSearches}
    onSelectSearch={runSearch}
    onRemoveSearch={term => updateRecentSearches(recentSearches.filter(item => item !== term))}
    onClose={closeExplore}
  />
)}

    <RightSideBar
      people={people}
      loading={peopleLoading}
      onExplore={() => setActiveView('explore')}
    />

    {chatTarget && (
      <Chatbox
        userName={chatTarget.name}
        onClose={() => setChatTarget(null)}
      />
    )}

    {summaryPost !== null && (
      <AISummary
        key={user.uid}
        user={user}
        postText={summaryPost}
        onClose={() => setSummaryPost(null)}
      />
    )}

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
