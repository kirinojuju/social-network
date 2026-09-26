import {
  collection, doc, getDoc, getDocs, getFirestore, limit, orderBy, query,
  serverTimestamp, setDoc, where,
} from 'firebase/firestore'
import { getClientApp } from '../auth/firebase'

const root = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '')

async function backendRequest(user, path, options = {}) {
  const token = await user.getIdToken()
  let response
  try {
    response = await fetch(`${root}/api/posts${path}`, {
      ...options,
      headers: { Authorization: `Bearer ${token}`, ...(options.body ? { 'Content-Type': 'application/json' } : {}) },
    })
  } catch {
    throw new Error('Cannot reach the backend. Check that the server is running.')
  }
  if (!response.ok) {
    if (response.status === 401) throw new Error('Your session expired. Sign out and sign in again.')
    throw new Error('The post request failed. Please try again.')
  }
  return response
}

function postFields(user, content, imageId = null, originalCreatedAt = null) {
  return {
    authorUid: user.uid,
    content: content.trim(),
    visibility: 'private',
    createdAt: serverTimestamp(),
    originalCreatedAt,
    imageId,
  }
}

function fromSnapshot(snapshot) {
  const data = snapshot.data()
  return {
    id: snapshot.id,
    content: data.content,
    visibility: data.visibility,
    created_at: data.originalCreatedAt || data.createdAt?.toDate().toISOString(),
    image_id: data.imageId,
  }
}

async function importExistingPosts(db, user, knownIds) {
  const rows = (await (await backendRequest(user, '')).json()).posts
  for (const row of rows) {
    if (knownIds.has(row.id)) continue
    const ref = doc(db, 'posts', row.id)
    await setDoc(ref, postFields(user, row.content, row.image_id,
      new Date(row.created_at).toISOString()))
  }
}

export async function listPosts(user) {
  const db = getFirestore(getClientApp())
  const owned = query(collection(db, 'posts'), where('authorUid', '==', user.uid))
  const existing = await getDocs(owned)
  await importExistingPosts(db, user, new Set(existing.docs.map(item => item.id)))
  const posts = query(collection(db, 'posts'), where('authorUid', '==', user.uid),
    orderBy('createdAt', 'desc'), limit(50))
  return (await getDocs(posts)).docs.map(fromSnapshot)
}

export async function createPost(user, values) {
  const db = getFirestore(getClientApp())
  let ref
  let fields
  if (values.image) {
    const saved = (await (await backendRequest(user, '', {
      method: 'POST', body: JSON.stringify(values),
    })).json()).post
    ref = doc(db, 'posts', saved.id)
    fields = postFields(user, saved.content, saved.image_id,
      new Date(saved.created_at).toISOString())
  } else {
    ref = doc(collection(db, 'posts'))
    fields = postFields(user, values.content)
  }
  await setDoc(ref, fields)
  return fromSnapshot(await getDoc(ref))
}

export const loadPostImage = async (user, id) =>
  (await backendRequest(user, `/${encodeURIComponent(id)}/image`)).blob()
