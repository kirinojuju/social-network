import { useCallback, useEffect, useState } from 'react'
import AuthFormLogin from './component/AuthFormsLogin'
import AuthFormSignUp from './component/AuthFormsSignUp'
import Welcome from './component/Welcome'
import LeftSidebar from './component/LeftSideBar'
import RightSideBar from './component/RightSideBar'
import Explore from './component/Explore'
import SearchResults from './component/SearchResults'
import MiddlePage from './component/MiddlePage'
import AISummary from './component/AI_summary'
import Chatbox from './component/Chatbox'
import MessagesPanel from './component/MessagesPanel'
import PostList from './posts/PostList'
import NotificationsPanel from './component/NotificationsPanel'
import { listNotifications } from './notifications/client'
import { isUnread, latestSeenAt, loadSeenAt, saveSeenAt, unreadMessageCount } from './notifications/seen'
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
  const [page, setPage] = useState('welcome')
  const [activeView, setActiveView] = useState('home')
  const [viewedProfileId, setViewedProfileId] = useState(null)
  const [exploreOpen, setExploreOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [submittedSearch, setSubmittedSearch] = useState('')
  const [recentSearches, setRecentSearches] = useState([])
  const [summaryPost, setSummaryPost] = useState(null)
  const [chatTarget, setChatTarget] = useState(null)
  const [messagesOpen, setMessagesOpen] = useState(false)
  const [composer, setComposer] = useState(null)
  const [avatarVersion, setAvatarVersion] = useState(0)
  const [homeVersion, setHomeVersion] = useState(0)
  const [notifications, setNotifications] = useState({ loaded: false, items: [] })
  const [notificationsSeenAt, setNotificationsSeenAt] = useState(null)
  const [notificationsPanel, setNotificationsPanel] = useState(null)
  const [notificationsOpenCount, setNotificationsOpenCount] = useState(0)
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

  useEffect(() => {
    if (!auth) return
    return watchUser(auth, nextUser => {
      setUser(nextUser)
      setPeopleLoading(Boolean(nextUser))
      setProfile(null)
      setProfileState(nextUser ? 'loading' : 'idle')
      setProfileError('')
      setLoading(false)
      setExploreOpen(false)
      setSearchQuery('')
      setSubmittedSearch('')
      setViewedProfileId(null)
      setMessagesOpen(false)
      setComposer(null)
      setNotifications({ loaded: false, items: [] })
      setNotificationsSeenAt(nextUser ? loadSeenAt(nextUser.uid) : null)
      setNotificationsPanel(null)
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
    }).catch(() => {}).finally(() => {
      if (active) setPeopleLoading(false)
    })
    return () => { active = false }
  }, [user, profileState])

  useAutoRefresh(async signal => {
    if (!user || peopleLoading) return
    const items = await profileClient.listPeople(user, { signal })
    if (!signal.aborted) setPeople(items)
  }, 30000, Boolean(user) && profileState === 'ready')

  useAutoRefresh(async signal => {
    if (!user) return
    try {
      const items = await listNotifications(user, { signal })
      if (!signal.aborted) setNotifications({ loaded: true, items })
    } catch (failure) {
      if (!signal.aborted) setNotifications(current => ({ ...current, loaded: true }))
      throw failure
    }
  }, 5000, Boolean(user) && profileState === 'ready',
  user ? `${user.uid}:${notificationsOpenCount}` : null)

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
  const closeMessages = useCallback(() => setMessagesOpen(false), [])
  const closeComposer = useCallback(() => setComposer(null), [])

  const markNotificationsSeen = useCallback(() => {
    if (!user) return
    const seenAt = latestSeenAt(notifications.items, notificationsSeenAt)
    if (seenAt && seenAt !== notificationsSeenAt) {
      setNotificationsSeenAt(seenAt)
      saveSeenAt(user.uid, seenAt)
    }
  }, [user, notifications.items, notificationsSeenAt])

  const closeNotifications = useCallback(() => {
    markNotificationsSeen()
    setNotificationsPanel(null)
  }, [markNotificationsSeen])

  function toggleNotifications() {
    if (notificationsPanel) return closeNotifications()
    setNotificationsPanel({ since: notificationsSeenAt })
    setNotificationsOpenCount(count => count + 1)
    setMessagesOpen(false)
    setExploreOpen(false)
    markNotificationsSeen()
  }

  const unreadNotifications = notificationsPanel ? 0
    : notifications.items.filter(item => isUnread(item, notificationsSeenAt)).length
  const unreadMessages = unreadMessageCount(notifications.items)

  function openChat(person) {
    setChatTarget({ id: person.id, name: person.display_name || person.username })
    setMessagesOpen(false)
    if (notificationsPanel) closeNotifications()
  }

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

  function openProfile(id = null) {
    setViewedProfileId(id)
    setActiveView('profile')
    setExploreOpen(false)
  }

  function goHome() {
    setActiveView('home')
    setViewedProfileId(null)
    setExploreOpen(false)
    setHomeVersion(version => version + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openComposer(files = null) {
    setActiveView('home')
    setExploreOpen(false)
    setComposer({ files })
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
      user={user}
      profile={profile}
      avatarVersion={avatarVersion}
      activeView={activeView === 'profile' && viewedProfileId && viewedProfileId !== profile?.id ? null : activeView}
      onNavigate={setActiveView}
      onLogoClick={goHome}
      onOpenProfile={() => openProfile()}
      onSignOut={signOut}
      signOutBusy={busy}
      onOpenAI={() => setSummaryPost('')}
      onOpenMessages={() => {
        if (notificationsPanel) closeNotifications()
        setMessagesOpen(open => !open)
      }}
      onOpenNotifications={toggleNotifications}
      unreadMessages={unreadMessages}
    />

   <TopBar
  user={user}
  profileId={profile?.id}
  avatarVersion={avatarVersion}
  onOpenProfile={() => openProfile()}
  onOpenExplore={() => setExploreOpen(true)}
  onCreatePost={() => openComposer()}
  unreadNotifications={unreadNotifications}
  onToggleNotifications={toggleNotifications}
  searchQuery={searchQuery}
  onSearchChange={setSearchQuery}
  onSearchSubmit={runSearch}
/>

<main className={`app-main${activeView === 'profile' ? ' full-width' : ''}`}>

  {error && (
    <p className="auth-error" role="alert">
      {error}
    </p>
  )}

  {activeView === 'profile' ? (
    <Profile
      user={user}
      profile={profile}
      profileId={viewedProfileId}
      onProfileChange={setProfile}
      onAvatarChange={() => setAvatarVersion(version => version + 1)}
      onMessage={openChat}
      onOpenProfile={openProfile}
      onSummarize={setSummaryPost}
      onSignOut={signOut}
      signOutBusy={busy}
    />
  ) : activeView === 'search' ? (
    <SearchResults user={user} query={submittedSearch} onOpenProfile={openProfile} />
  ) : activeView === 'saved' ? (
    <div className="saved-page">
      <PostList user={user} scope="saved" title="Saved posts" onOpenProfile={openProfile} onSummarize={setSummaryPost}
        emptyText="You haven't saved any posts yet. Tap Save on a post to keep it here." />
    </div>
  ) : (
    <MiddlePage
      key={`${user.uid}:${homeVersion}`}
      user={user}
      profile={profile}
      composer={composer}
      onOpenComposer={openComposer}
      onCloseComposer={closeComposer}
      onOpenProfile={openProfile}
      onSummarize={setSummaryPost}
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

    {activeView !== 'profile' && (
      <RightSideBar
        user={user}
        people={people}
        loading={peopleLoading}
        onOpenProfile={openProfile}
      />
    )}

    {messagesOpen && (
      <MessagesPanel
        user={user}
        people={people}
        onOpenChat={openChat}
        onClose={closeMessages}
      />
    )}

    {notificationsPanel && (
      <NotificationsPanel
        user={user}
        notifications={notifications.items}
        loaded={notifications.loaded}
        since={notificationsPanel.since}
        onOpenProfile={id => {
          closeNotifications()
          openProfile(id)
        }}
        onOpenChat={openChat}
        onClose={closeNotifications}
      />
    )}

    {chatTarget && (
      <Chatbox
        key={chatTarget.id}
        user={user}
        target={chatTarget}
        onClose={() => setChatTarget(null)}
        onOpenProfile={openProfile}
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

  if (page === 'welcome') {
    return <Welcome onCreateAccount={() => setPage('signup')} onSignIn={() => setPage('login')} />
  }

  return (
    <main className="app-container auth-page">
      <button type="button" className="auth-back" onClick={() => setPage('welcome')}>← Back</button>
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