import test from 'node:test'
import assert from 'node:assert/strict'
import { startAutoRefresh } from '../src/live/auto-refresh.js'
import { mergeNewestComments } from '../src/posts/merge-comments.js'

function environment() {
  const documentObject = Object.assign(new EventTarget(), { hidden: false })
  const windowObject = new EventTarget()
  const timers = new Map()
  let id = 0
  return {
    documentObject, windowObject, timers,
    options: { documentObject, windowObject,
      setTimer: callback => { timers.set(++id, callback); return id },
      clearTimer: key => timers.delete(key),
    },
    async tick() {
      assert.equal(timers.size, 1)
      const [key, callback] = timers.entries().next().value
      timers.delete(key)
      await callback()
    },
  }
}

const settle = async () => { await Promise.resolve(); await Promise.resolve() }

test('background checks pause when hidden and resume on visibility/focus/network recovery', async () => {
  const env = environment()
  let calls = 0
  const stop = startAutoRefresh(async () => { calls++ }, env.options)
  assert.equal(calls, 0)
  await env.tick()
  assert.equal(calls, 1)
  env.documentObject.hidden = true
  env.documentObject.dispatchEvent(new Event('visibilitychange'))
  assert.equal(env.timers.size, 0)
  env.windowObject.dispatchEvent(new Event('focus'))
  assert.equal(calls, 1)
  env.documentObject.hidden = false
  env.documentObject.dispatchEvent(new Event('visibilitychange'))
  await settle()
  assert.equal(calls, 2)
  env.windowObject.dispatchEvent(new Event('online'))
  await settle()
  assert.equal(calls, 3)
  assert.equal(env.timers.size, 1)
  stop()
  assert.equal(env.timers.size, 0)
  env.windowObject.dispatchEvent(new Event('focus'))
  assert.equal(calls, 3)
})

test('checks do not overlap and cleanup aborts pending requests without scheduling another', async () => {
  const env = environment()
  let calls = 0, signal, finish
  const stop = startAutoRefresh(async value => {
    calls++
    signal = value
    await new Promise(resolve => { finish = resolve })
  }, { ...env.options, immediate: true })
  env.windowObject.dispatchEvent(new Event('focus'))
  env.windowObject.dispatchEvent(new Event('online'))
  assert.equal(calls, 1)
  stop()
  assert.equal(signal.aborted, true)
  finish()
  await settle()
  assert.equal(env.timers.size, 0)
})

test('temporary background request errors are retried on the next scheduled check', async () => {
  const env = environment()
  let calls = 0
  const stop = startAutoRefresh(async () => {
    if (++calls === 1) throw new Error('Offline')
  }, env.options)
  await env.tick()
  assert.equal(calls, 1)
  await env.tick()
  assert.equal(calls, 2)
  stop()
})

test('refreshing comment pages keeps loaded older comments and removes deleted recent ones', () => {
  const current = ['d', 'c', 'b', 'a'].map(id => ({ id }))
  const newest = ['e', 'c', 'b'].map(id => ({ id }))
  assert.deepEqual(mergeNewestComments(current, newest).map(c => c.id), ['e', 'c', 'b', 'a'])
  assert.deepEqual(mergeNewestComments(current, []).map(c => c.id), [])
  assert.deepEqual(mergeNewestComments(current, [{ id: 'z' }]).map(c => c.id), ['z', 'd', 'c', 'b', 'a'])
})
