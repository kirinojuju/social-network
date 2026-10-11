export class ProfileApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ProfileApiError'
    this.status = status
  }
}

const defaultBaseUrl = 'http://127.0.0.1:3000'

export function profileToSync(profile) {
  return {
    username: profile.username,
    display_name: profile.display_name,
    bio: profile.bio,
    avatar_url: profile.avatar_url,
    faculty_id: profile.faculty_id,
    major_id: profile.major_id,
  }
}

export function createProfileClient({ baseUrl = defaultBaseUrl, fetchImpl = fetch } = {}) {
  const root = baseUrl.replace(/\/$/, '')

  async function authHeaders(user) {
    try {
      const token = await user.getIdToken()
      return { Authorization: `Bearer ${token}` }
    } catch {
      throw new ProfileApiError('Your session could not be verified. Sign out and sign in again.')
    }
  }

  async function request(user, path, method, body) {
    // Obtain a current ID token for each request; never store it in app state.
    const headers = await authHeaders(user)
    let response
    try {
      response = await fetchImpl(`${root}/api/users/${path}`, {
        method,
        headers: {
          ...headers,
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      })
    } catch {
      throw new ProfileApiError('Cannot reach the profile server. Check that the backend is running.')
    }
    if (!response.ok) {
      const messages = {
        401: 'The backend could not verify your sign-in. Check its Firebase setup, then try again.',
        403: 'Your account needs a valid email address.',
        409: 'That username or email is already in use. Choose another username.',
      }
      throw new ProfileApiError(messages[response.status] || 'The profile request failed. Please try again.', response.status)
    }
    try {
      const data = await response.json()
      if (data?.user && typeof data.user === 'object') return data.user
    } catch {
      // Treat malformed responses as a server error without exposing response data.
    }
    throw new ProfileApiError('The profile server returned an invalid response.')
  }

  const get = user => request(user, 'me', 'GET')
  const sync = (user, profile) => request(user, 'sync', 'POST', profile)
  const ensure = user => request(user, 'ensure', 'POST', { display_name: user.displayName || undefined })

  return {
    get,
    sync,
    ensure,
    async load(user) {
      let existing
      try {
        existing = await get(user)
      } catch (error) {
        if (error.status === 404) return null
        throw error
      }
      await sync(user, profileToSync(existing))
      return get(user)
    },
    async syncAndRead(user, profile) {
      await sync(user, profile)
      return get(user)
    },
    async listPeople(user, { signal } = {}) {
      const headers = await authHeaders(user)
      let response
      try {
        response = await fetchImpl(`${root}/api/users`, { headers, signal, cache: 'no-store' })
      } catch {
        throw new ProfileApiError('Cannot reach the profile server. Check that the backend is running.')
      }
      if (!response.ok) {
        throw new ProfileApiError('Could not load people. Please try again.', response.status)
      }
      try {
        const data = await response.json()
        return Array.isArray(data?.users) ? data.users : []
      } catch {
        throw new ProfileApiError('The profile server returned an invalid response.')
      }
    },
    getUser: (user, id) => request(user, encodeURIComponent(id), 'GET'),
    async listFollowing(user, { signal } = {}) {
      const headers = await authHeaders(user)
      const response = await fetchImpl(`${root}/api/users/me/following`, { headers, signal, cache: 'no-store' })
      if (!response.ok) throw new ProfileApiError('Could not load friends.', response.status)
      const data = await response.json()
      return Array.isArray(data?.users) ? data.users : []
    },
    async listFriends(user, id, { signal } = {}) {
      const headers = await authHeaders(user)
      let response
      try {
        response = await fetchImpl(`${root}/api/users/${encodeURIComponent(id)}/friends`,
          { headers, signal, cache: 'no-store' })
      } catch (failure) {
        if (failure.name === 'AbortError') throw failure
        throw new ProfileApiError('Cannot reach the profile server. Check that the backend is running.')
      }
      if (!response.ok) throw new ProfileApiError('Could not load friends.', response.status)
      const data = await response.json()
      return { friends: Array.isArray(data?.friends) ? data.friends : [], total: Number(data?.total) || 0 }
    },
    async getFollow(user, id, { signal } = {}) {
      return followRequest(user, id, 'GET', signal)
    },
    async setFollow(user, id, following) {
      return followRequest(user, id, following ? 'PUT' : 'DELETE')
    },
    async loadAvatar(user, id, { signal, kind = 'avatar' } = {}) {
      const headers = await authHeaders(user)
      const response = await fetchImpl(`${root}/api/users/${encodeURIComponent(id)}/${kind}`,
        { headers, signal, cache: 'no-store' })
      return response.ok ? response.blob() : null
    },
    async saveAvatar(user, image, kind = 'avatar') {
      await avatarRequest(user, 'PUT', { image }, kind)
    },
    async removeAvatar(user, kind = 'avatar') {
      await avatarRequest(user, 'DELETE', undefined, kind)
    },
  }

  async function followRequest(user, id, method, signal) {
    const headers = await authHeaders(user)
    let response
    try {
      response = await fetchImpl(`${root}/api/users/${encodeURIComponent(id)}/follow`,
        { method, headers, signal, cache: 'no-store' })
    } catch (failure) {
      if (failure.name === 'AbortError') throw failure
      throw new ProfileApiError('Cannot reach the profile server. Check that the backend is running.')
    }
    if (!response.ok) {
      throw new ProfileApiError(method === 'GET' ? 'Could not load followers.'
        : 'Could not update follow. Please try again.', response.status)
    }
    const data = await response.json()
    return data.follow
  }

  async function avatarRequest(user, method, body, kind) {
    const headers = await authHeaders(user)
    let response
    try {
      response = await fetchImpl(`${root}/api/users/me/${kind}`, {
        method,
        headers: { ...headers, ...(body ? { 'Content-Type': 'application/json' } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}),
      })
    } catch {
      throw new ProfileApiError('Cannot reach the profile server. Check that the backend is running.')
    }
    if (!response.ok) {
      throw new ProfileApiError(`Could not update your ${kind === 'cover' ? 'cover' : 'profile'} photo. Please try again.`,
        response.status)
    }
  }
}

export const profileClient = createProfileClient({
  baseUrl: import.meta.env?.VITE_API_BASE_URL || (import.meta.env?.DEV ? defaultBaseUrl : ''),
})
