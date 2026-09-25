import { useState } from 'react'

export default function ProfileOnboarding({ user, busy, error, onSave }) {
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState(user.displayName || '')

  function submit(event) {
    event.preventDefault()
    onSave({ username: username.trim(), display_name: displayName.trim() })
  }

  return (
    <>
      <h2>Set up your profile</h2>
      <p>Choose a username to finish connecting your verified account.</p>
      <form className="signin-inner" onSubmit={submit} aria-busy={busy}>
        <fieldset className="auth-fields" disabled={busy}>
          <div className="form-group">
            <label htmlFor="profile-username">Username</label>
            <input id="profile-username" type="text" value={username}
              onChange={event => setUsername(event.target.value)}
              minLength={3} maxLength={30} pattern="[a-z0-9_]{3,30}"
              title="Use 3–30 lowercase letters, numbers, or underscores" required />
          </div>
          <div className="form-group">
            <label htmlFor="profile-name">Display name</label>
            <input id="profile-name" type="text" value={displayName}
              onChange={event => setDisplayName(event.target.value)}
              maxLength={100} required />
          </div>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="btn" type="submit">{busy ? 'Saving…' : 'Save profile'}</button>
        </fieldset>
      </form>
    </>
  )
}
