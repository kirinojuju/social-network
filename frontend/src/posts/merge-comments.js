// Keep loaded older pages when refreshing the newest page. The server's order
// is authoritative; IDs at the page boundary avoid resetting the user's view.
export function mergeNewestComments(current, newest) {
  if (!newest.length) return []
  const ids = new Set(newest.map(comment => comment.id))
  const boundary = current.findIndex(comment => comment.id === newest.at(-1).id)
  const older = boundary >= 0 ? current.slice(boundary + 1) : current
  return [...newest, ...older.filter(comment => !ids.has(comment.id))]
}
