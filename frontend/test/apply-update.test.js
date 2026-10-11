import test from 'node:test'
import assert from 'node:assert/strict'
import { applyPostUpdate } from '../src/posts/apply-update.js'

test('following an author from one post updates all of their posts', () => {
  const posts = [
    { id: '1', author_id: 'a', author_following: false, like_count: 0 },
    { id: '2', author_id: 'b', author_following: false, like_count: 0 },
    { id: '3', author_id: 'a', author_following: false, like_count: 4 },
  ]
  assert.deepEqual(applyPostUpdate(posts, { ...posts[0], author_following: true }), [
    { id: '1', author_id: 'a', author_following: true, like_count: 0 },
    { id: '2', author_id: 'b', author_following: false, like_count: 0 },
    { id: '3', author_id: 'a', author_following: true, like_count: 4 },
  ])
})

test('other post updates only change that post', () => {
  const posts = [{ id: '1', author_id: 'a', like_count: 0 }, { id: '2', author_id: 'a', like_count: 0 }]
  assert.deepEqual(applyPostUpdate(posts, { id: '1', author_id: 'a', like_count: 1 }),
    [{ id: '1', author_id: 'a', like_count: 1 }, { id: '2', author_id: 'a', like_count: 0 }])
})
