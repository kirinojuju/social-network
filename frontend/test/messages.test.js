import test from 'node:test'
import assert from 'node:assert/strict'
import { shortTimeAgo } from '../src/messages/time.js'

test('message times are shown compactly like a chat list', () => {
  const now = Date.parse('2026-10-11T12:00:00Z')
  const ago = seconds => new Date(now - seconds * 1000).toISOString()
  assert.equal(shortTimeAgo(ago(5), now), 'now')
  assert.equal(shortTimeAgo(ago(-30), now), 'now')
  assert.equal(shortTimeAgo(ago(5 * 60), now), '5m')
  assert.equal(shortTimeAgo(ago(3 * 3600), now), '3h')
  assert.equal(shortTimeAgo(ago(2 * 86400), now), '2d')
  assert.equal(shortTimeAgo(ago(15 * 86400), now), '2w')
  assert.equal(shortTimeAgo(ago(60 * 86400), now), new Date(ago(60 * 86400)).toLocaleDateString())
})
