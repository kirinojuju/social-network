import test from 'node:test'
import assert from 'node:assert/strict'
import { addRecentSearch, loadRecentSearches, maxRecentSearches, saveRecentSearches } from '../src/search/recent.js'

function memoryStorage() {
  const values = new Map()
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
    values,
  }
}

test('new searches go first, duplicates are merged case-insensitively, and the list is capped', () => {
  let items = []
  for (const term of ['notes', '  fresher   night ', 'NOTES', '   ']) items = addRecentSearch(items, term)
  assert.deepEqual(items, ['NOTES', 'fresher night'])
  for (let i = 0; i < 20; i++) items = addRecentSearch(items, `term ${i}`)
  assert.equal(items.length, maxRecentSearches)
  assert.equal(items[0], 'term 19')
})

test('recent searches are stored per account and survive malformed storage', () => {
  const storage = memoryStorage()
  saveRecentSearches('alice', ['notes'], storage)
  saveRecentSearches('bob', ['market'], storage)
  assert.deepEqual(loadRecentSearches('alice', storage), ['notes'])
  assert.deepEqual(loadRecentSearches('bob', storage), ['market'])
  saveRecentSearches('alice', [], storage)
  assert.deepEqual(loadRecentSearches('alice', storage), [])
  storage.setItem('uniconnect:recent-searches:bob', '{not json')
  assert.deepEqual(loadRecentSearches('bob', storage), [])
  const broken = { getItem() { throw new Error('denied') }, setItem() { throw new Error('full') }, removeItem() {} }
  assert.deepEqual(loadRecentSearches('alice', broken), [])
  assert.doesNotThrow(() => saveRecentSearches('alice', ['x'], broken))
})
