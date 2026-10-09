import { collection, getDocs, getFirestore, limit, query, startAfter, where } from 'firebase/firestore'
import { getClientApp } from '../auth/firebase'

const defaultBaseUrl = import.meta.env?.DEV ? 'http://127.0.0.1:3000' : ''
const root = (import.meta.env?.VITE_API_BASE_URL || defaultBaseUrl).replace(/\/$/, '')

async function backendRequest(user, path, options = {}) {
  const token = await user.getIdToken()
  let response
  try {
    response = await fetch(`${root}/api/posts${path}`, {
      cache: 'no-store',
      ...options,
      headers: { Authorization: `Bearer ${token}`, ...(options.body ? { 'Content-Type': 'application/json' } : {}) },
    })
  } catch {
    throw new Error('Cannot reach the backend. Check that the server is running.')
  }
  if (!response.ok) {
    if (response.status === 401) throw new Error('Your session expired. Sign out and sign in again.')
    if (response.status === 404) throw new Error('This post or comment is no longer available to you. Refresh the feed.')
    throw new Error('The post request failed. Please try again.')
  }
  return response
}

const json = async (user, path, method, body) => (await backendRequest(user, path, {
  method, ...(body ? { body: JSON.stringify(body) } : {}),
})).json()

export const listPosts = async (user, { signal } = {}) =>
  (await (await backendRequest(user, '?scope=feed', { signal })).json()).posts
export const createPost = async (user, values) => (await json(user, '', 'POST', values)).post
export const setPostLike = async (user, id, liked) =>
  (await json(user, `/${encodeURIComponent(id)}/like`, liked ? 'PUT' : 'DELETE')).post
export const setPostVisibility = async (user, id, visibility) =>
  (await json(user, `/${encodeURIComponent(id)}/visibility`, 'PATCH', { visibility })).post
export const listComments = async (user, id, before = null, { signal } = {}) =>
  (await backendRequest(user,
    `/${encodeURIComponent(id)}/comments${before ? `?before=${encodeURIComponent(before)}` : ''}`, { signal })).json()
export const createComment = async (user, id, content) =>
  (await json(user, `/${encodeURIComponent(id)}/comments`, 'POST', { content })).comment
export const deleteComment = async (user, postId, commentId) => {
  await backendRequest(user, `/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`, { method: 'DELETE' })
}

// Read only the signed-in member's legacy documents. No Firestore writes.
// The server deduplicates imports and keeps them private.
export async function importLegacyPosts(user) {
  const db = getFirestore(getClientApp())
  let cursor = null
  let imported = 0
  while (true) {
    const constraints = [where('authorUid', '==', user.uid), limit(100)]
    if (cursor) constraints.push(startAfter(cursor))
    const page = await getDocs(query(collection(db, 'posts'), ...constraints))
    const posts = page.docs.filter(item => /^[A-Za-z0-9]{20}$/.test(item.id)).map(item => {
      const data = item.data()
      return { source_id: item.id, content: data.content,
        created_at: data.originalCreatedAt || data.createdAt?.toDate().toISOString() }
    })
    for (let offset = 0; offset < posts.length; offset += 50) {
      imported += (await json(user, '/import', 'POST', { posts: posts.slice(offset, offset + 50) })).imported
    }
    if (page.size < 100) return imported
    cursor = page.docs.at(-1)
  }
}

export const loadPostImage = async (user, id) =>
  (await backendRequest(user, `/${encodeURIComponent(id)}/image`)).blob()
