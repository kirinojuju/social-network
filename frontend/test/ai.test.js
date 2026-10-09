import assert from 'node:assert/strict'
import test from 'node:test'
import { aiBaseUrl, createAiClient } from '../src/ai/client.js'

test('AI uses the Render origin in production and the local backend during development', () => {
  assert.equal(aiBaseUrl({ PROD: true }), '')
  assert.equal(aiBaseUrl({ DEV: true }), 'http://127.0.0.1:3000')
  assert.equal(aiBaseUrl({ VITE_API_BASE_URL: 'https://api.example/' }), 'https://api.example')
})

test('AI requests authenticate afresh and long conversations keep the latest turns', async () => {
  let token = 0
  const calls = []
  const client = createAiClient({ baseUrl: '', fetchImpl: async (url, options) => {
    calls.push({ url, ...options })
    return Response.json(url.endsWith('/chat') ? { reply: 'answer' } : { summary: 'summary' })
  } })
  const user = { getIdToken: async () => `token-${++token}` }
  const messages = Array.from({ length: 25 }, (_, i) => ({
    role: i % 2 ? 'assistant' : 'user', content: `turn ${i}`,
  }))
  assert.equal(await client.chatWithAI(user, messages, 'selected post'), 'answer')
  assert.equal(await client.summarizePost(user, 'text'), 'summary')
  assert.equal(calls[0].url, '/api/ai/chat')
  assert.equal(calls[0].headers.Authorization, 'Bearer token-1')
  assert.equal(calls[1].headers.Authorization, 'Bearer token-2')
  assert.equal(calls[0].cache, 'no-store')
  assert.deepEqual(JSON.parse(calls[0].body), { messages: messages.slice(-19), context: 'selected post' })
  assert.equal(messages.length, 25)
})

test('AI reports expired sessions, provider errors and connection failures safely', async () => {
  const user = { getIdToken: async () => 'token' }
  for (const [status, message] of [[401, /session expired/], [502, /could not answer/]]) {
    const client = createAiClient({ fetchImpl: async () => new Response('private provider details', { status }) })
    await assert.rejects(client.chatWithAI(user, [{ role: 'user', content: 'hi' }]), message)
  }
  const offline = createAiClient({ fetchImpl: async () => { throw new Error('internal network details') } })
  await assert.rejects(offline.summarizePost(user, 'hi'), /Cannot reach the backend/)
})
