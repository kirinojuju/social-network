import assert from 'node:assert/strict'
import test from 'node:test'
import { createProfileClient, ProfileApiError } from '../src/auth/profile.js'

test('session creates a profile, rereads it, and preserves it on the next session', async () => {
  let stored = null
  let tokenNumber = 0
  const requests = []
  const user = { getIdToken: async () => `test-token-${++tokenNumber}` }
  const fetchImpl = async (url, options) => {
    const path = new URL(url).pathname
    requests.push({ path, ...options })
    if (path.endsWith('/me')) {
      return stored ? Response.json({ user: stored }) : Response.json({ error: 'Profile not found' }, { status: 404 })
    }
    const body = JSON.parse(options.body)
    stored = { id: stored?.id || 'persistent-profile-id', firebase_uid: 'trusted-uid',
      email: 'test@example.com', ...body }
    return Response.json({ user: stored })
  }

  const firstSession = createProfileClient({ baseUrl: 'http://127.0.0.1:3000/', fetchImpl })
  assert.equal(await firstSession.load(user), null)
  const created = await firstSession.syncAndRead(user, {
    username: 'test_user', display_name: 'Test User',
  })
  assert.equal(created.id, 'persistent-profile-id')

  // A new client instance represents a new sign-in after the API process restarts.
  const secondSession = createProfileClient({ fetchImpl })
  const restored = await secondSession.load(user)
  assert.equal(restored.id, created.id)
  assert.equal(restored.username, 'test_user')
  assert.deepEqual(requests.map(request => `${request.method} ${request.path}`), [
    'GET /api/users/me', 'POST /api/users/sync', 'GET /api/users/me',
    'GET /api/users/me', 'POST /api/users/sync', 'GET /api/users/me',
  ])
  assert.deepEqual(requests.map(request => request.headers.Authorization),
    Array.from({ length: 6 }, (_, index) => `Bearer test-token-${index + 1}`))
  assert.deepEqual(JSON.parse(requests[4].body), {
    username: 'test_user', display_name: 'Test User',
  })
  assert.ok(!requests[4].body.includes('firebase_uid'))
  assert.ok(!requests[4].body.includes('email'))
})

test('profile errors expose safe messages and distinguish missing profiles', async () => {
  const user = { getIdToken: async () => 'test-token' }
  for (const status of [401, 403, 409, 500]) {
    const client = createProfileClient({ fetchImpl: async () =>
      Response.json({ error: 'private server detail' }, { status }) })
    await assert.rejects(client.get(user), error =>
      error instanceof ProfileApiError && error.status === status &&
      !error.message.includes('private server detail'))
  }
  const offline = createProfileClient({ fetchImpl: async () => { throw new Error('private connection detail') } })
  await assert.rejects(offline.get(user), error =>
    error instanceof ProfileApiError && !error.message.includes('private connection detail'))
})

test('ensure sends a display name and current Firebase token for first login', async () => {
  const client = createProfileClient({ fetchImpl: async (url, options) => {
    assert.equal(new URL(url).pathname, '/api/users/ensure')
    assert.equal(options.headers.Authorization, 'Bearer first-login-token')
    assert.deepEqual(JSON.parse(options.body), { display_name: 'New User' })
    return Response.json({ user: { id: 'created-profile' } })
  } })
  assert.deepEqual(await client.ensure({ displayName: 'New User', getIdToken: async () => 'first-login-token' }),
    { id: 'created-profile' })
})
