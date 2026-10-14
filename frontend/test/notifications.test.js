import test from 'node:test'
import assert from 'node:assert/strict'
import { isUnread, latestSeenAt, loadSeenAt, saveSeenAt, unreadMessageCount } from '../src/notifications/seen.js'

function memoryStorage() {
  const values = new Map()
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  }
}

test('viewing notifications does not mark messages read; badges count unread messages', () => {
  const message = { type: 'message', unread_count: 2, created_at: '2026-10-11T09:00:00.000Z' }
  const seenAt = '2026-10-11T10:00:00.000Z'
  assert.equal(isUnread(message, seenAt), true)
  assert.equal(isUnread({ ...message, unread_count: 0 }, null), false)
  assert.equal(unreadMessageCount([message, { ...message, unread_count: 1 }, { type: 'like' }]), 3)
  assert.equal(unreadMessageCount([]), 0)
})

test('seen time is stored per member and ignores invalid values', () => {
  const storage = memoryStorage()
  assert.equal(loadSeenAt('a', storage), null)
  saveSeenAt('a', '2026-10-11T10:00:00.000Z', storage)
  assert.equal(loadSeenAt('a', storage), '2026-10-11T10:00:00.000Z')
  assert.equal(loadSeenAt('b', storage), null)
  storage.setItem('uniconnect:notifications-seen:b', 'not a date')
  assert.equal(loadSeenAt('b', storage), null)
  const broken = { getItem() { throw new Error('disabled') }, setItem() { throw new Error('disabled') } }
  assert.equal(loadSeenAt('a', broken), null)
  assert.doesNotThrow(() => saveSeenAt('a', '2026-10-11T10:00:00.000Z', broken))
})

test('notifications newer than the seen time are unread, and seen time only moves forward', () => {
  const older = { created_at: '2026-10-11T09:00:00.000Z' }
  const newer = { created_at: '2026-10-11T11:00:00.000Z' }
  const seenAt = '2026-10-11T10:00:00.000Z'
  assert.equal(isUnread(older, seenAt), false)
  assert.equal(isUnread(newer, seenAt), true)
  assert.equal(isUnread(older, null), true)
  assert.equal(latestSeenAt([older, newer], seenAt), newer.created_at)
  assert.equal(latestSeenAt([older], seenAt), seenAt)
  assert.equal(latestSeenAt([], seenAt), seenAt)
  assert.equal(latestSeenAt([], null), null)
})
