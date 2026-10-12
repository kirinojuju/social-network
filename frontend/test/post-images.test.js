import test from 'node:test'
import assert from 'node:assert/strict'
import { postImageIds } from '../src/posts/images.js'

test('post photos keep their order and fall back to the single legacy photo', () => {
  assert.deepEqual(postImageIds({ image_id: 'a', image_ids: ['a', 'b', 'c'] }), ['a', 'b', 'c'])
  assert.deepEqual(postImageIds({ image_id: 'a' }), ['a'])
  assert.deepEqual(postImageIds({ image_id: 'a', image_ids: [] }), ['a'])
  assert.deepEqual(postImageIds({ image_id: null, image_ids: [] }), [])
})
