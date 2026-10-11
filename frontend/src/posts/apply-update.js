// Replaces the changed post and carries a follow change over to the author's other posts.
export function applyPostUpdate(posts, updated) {
  return posts.map(item => {
    if (item.id === updated.id) return { ...item, ...updated }
    if (item.author_id === updated.author_id && typeof updated.author_following === 'boolean') {
      return { ...item, author_following: updated.author_following }
    }
    return item
  })
}
