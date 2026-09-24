import assert from 'node:assert/strict'
import test from 'node:test'
import { createAuthActions } from '../src/auth/actions.js'
import { authError, validateSignup } from '../src/auth/validation.js'

const values = { firstName: ' Test ', lastName: ' User ', email: ' test@example.com ', password: ' password ', confirmPassword: ' password ' }

function setup(overrides = {}) {
  const calls = []
  const user = { uid: 'test-user' }
  const client = {
    create: async (...args) => { calls.push(['create', ...args]); return user },
    updateName: async (...args) => { calls.push(['updateName', ...args]) },
    sendVerification: async (...args) => { calls.push(['sendVerification', ...args]) },
    resetPassword: async (...args) => { calls.push(['resetPassword', ...args]) },
    ...overrides,
  }
  return { actions: createAuthActions(client), calls, user }
}

test('signup trims names and email, preserves the password, and sends verification', async () => {
  const { actions, calls, user } = setup()
  const result = await actions.signup(values)
  assert.equal(result.user, user)
  assert.deepEqual(calls, [
    ['create', 'test@example.com', ' password '],
    ['updateName', user, 'Test User'],
    ['sendVerification', user],
  ])
  assert.match(result.message, /Account created/)
})

test('invalid signup inputs never create an account', async () => {
  for (const changes of [
    { firstName: ' ' }, { lastName: '' }, { email: 'invalid' },
    { password: 'short', confirmPassword: 'short' }, { confirmPassword: 'different' },
    { firstName: 'x'.repeat(101) },
  ]) {
    const { actions, calls } = setup()
    await assert.rejects(actions.signup({ ...values, ...changes }))
    assert.deepEqual(calls, [])
  }
  assert.equal(validateSignup(values), null)
})

test('account creation failure does not send verification or update a profile', async () => {
  const failure = { code: 'auth/email-already-in-use' }
  const { actions, calls } = setup({ create: async () => { throw failure } })
  await assert.rejects(actions.signup(values), error => error === failure)
  assert.deepEqual(calls, [])
})

test('verification delivery failure preserves the created account and explains retry', async () => {
  const { actions, user } = setup({ sendVerification: async () => { throw new Error('offline') } })
  const result = await actions.signup(values)
  assert.equal(result.user, user)
  assert.match(result.message, /Resend verification email/)
})

test('name update failure still sends verification and reports the partial result', async () => {
  const { actions, calls, user } = setup({ updateName: async () => { throw new Error('offline') } })
  const result = await actions.signup(values)
  assert.equal(result.user, user)
  assert.match(result.message, /name could not be saved/)
  assert.deepEqual(calls.at(-1), ['sendVerification', user])
})

test('password reset uses the same confirmation for known and unknown emails', async () => {
  const { actions, calls } = setup()
  const unknown = setup({ resetPassword: async () => { throw { code: 'auth/user-not-found' } } })
  assert.equal(await actions.resetPassword(values.email), await unknown.actions.resetPassword(values.email))
  assert.deepEqual(calls, [['resetPassword', 'test@example.com']])
})

test('password reset connection errors remain errors', async () => {
  const { actions } = setup({ resetPassword: async () => { throw { code: 'auth/network-request-failed' } } })
  await assert.rejects(actions.resetPassword(values.email), error => error.code === 'auth/network-request-failed')
})

test('UI error messages do not expose provider details or distinguish invalid credentials', () => {
  assert.equal(authError({ code: 'auth/wrong-password' }), authError({ code: 'auth/user-not-found' }))
  assert.equal(authError({ message: 'private internal detail' }), 'Something went wrong. Please try again.')
  assert.match(authError({ code: 'auth/not-configured' }), /not available/)
})
