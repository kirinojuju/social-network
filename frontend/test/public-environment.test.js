import test from 'node:test'
import assert from 'node:assert/strict'
import { assertPublicEnvironment } from '../config/public-environment.js'

test('frontend builds reject backend secret names without revealing values', () => {
  for (const name of ['VITE_OPENROUTER_API_KEY', 'VITE_DATABASE_URL', 'VITE_PGPASSWORD',
    'VITE_PRIVATE_KEY', 'VITE_ACCESS_TOKEN', 'VITE_SERVICE_ACCOUNT']) {
    assert.throws(() => assertPublicEnvironment({ [name]: 'private-value-do-not-log' }), error =>
      error.message.includes(name) && !error.message.includes('private-value-do-not-log'))
  }
  assert.doesNotThrow(() => assertPublicEnvironment({
    VITE_FIREBASE_API_KEY: 'public-web-config', VITE_FIREBASE_PROJECT_ID: 'project',
    VITE_API_BASE_URL: 'https://example.test', PROD: true,
  }))
})
