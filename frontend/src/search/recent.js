// Recent searches stay in this browser only; they are never sent to the backend.
export const maxRecentSearches = 8

const storageKey = uid => `uniconnect:recent-searches:${uid}`
const defaultStorage = () => globalThis.localStorage

export function loadRecentSearches(uid, storage = defaultStorage()) {
  try {
    const items = JSON.parse(storage.getItem(storageKey(uid)))
    return Array.isArray(items)
      ? items.filter(item => typeof item === 'string' && item.trim()).slice(0, maxRecentSearches)
      : []
  } catch {
    return []
  }
}

export function saveRecentSearches(uid, items, storage = defaultStorage()) {
  try {
    if (items.length) storage.setItem(storageKey(uid), JSON.stringify(items))
    else storage.removeItem(storageKey(uid))
  } catch {
    // Storage can be full or disabled (e.g. private browsing); recent searches are optional.
  }
}

export function addRecentSearch(items, query) {
  const term = query.trim().replace(/\s+/g, ' ')
  if (!term) return items
  return [term, ...items.filter(item => item.toLowerCase() !== term.toLowerCase())]
    .slice(0, maxRecentSearches)
}
