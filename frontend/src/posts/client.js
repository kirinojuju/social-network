import {
  collection, doc, getDoc, getDocs, getFirestore, limit, orderBy, query,
  serverTimestamp, setDoc, updateDoc, where,
} from 'firebase/firestore'
import { getClientApp } from '../auth/firebase'

const defaultBaseUrl = import.meta.env?.DEV ? 'http://127.0.0.1:3000' : ''
const root = (import.meta.env?.VITE_API_BASE_URL || defaultBaseUrl).replace(/\/$/, '')

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

function postFields(user, content, imageId = null, originalCreatedAt = null, visibility = 'private') {
  return {
    authorUid: user.uid,
    content: content.trim(),
    visibility,
    createdAt: serverTimestamp(),
    originalCreatedAt,
    imageId,
  }
}

function fromSnapshot(snapshot) {
  const data = snapshot.data()
  return {
    id: snapshot.id,
    author_uid: data.authorUid,
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
      new Date(row.created_at).toISOString(), row.visibility))
  }
}

export async function listPublicPosts() {
  const db = getFirestore(getClientApp())
  const posts = query(collection(db, 'posts'), where('visibility', '==', 'public'),
    orderBy('createdAt', 'desc'), limit(50))
  return (await getDocs(posts)).docs.map(fromSnapshot)
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
      new Date(saved.created_at).toISOString(), saved.visibility)
  } else {
    ref = doc(collection(db, 'posts'))
    fields = postFields(user, values.content, null, null, values.visibility)
  }
  try {
    await setDoc(ref, fields)
  } catch (error) {
    if (values.image && fields.visibility === 'public') {
      try { await backendRequest(user, `/${encodeURIComponent(ref.id)}/visibility`, {
        method: 'PATCH', body: JSON.stringify({ visibility: 'private' }),
      }) } catch { /* Keep the original error; a private retry can be done later. */ }
    }
    throw error
  }
  return fromSnapshot(await getDoc(ref))
}

export async function changePostVisibility(user, post, visibility) {
  if (!['public', 'private'].includes(visibility)) throw new Error('Invalid visibility')
  const ref = doc(getFirestore(getClientApp()), 'posts', post.id)
  const changeDatabase = value => backendRequest(user, `/${encodeURIComponent(post.id)}/visibility`, {
    method: 'PATCH', body: JSON.stringify({ visibility: value }),
  })
  if (!post.image_id) {
    await updateDoc(ref, { visibility })
  } else if (visibility === 'public') {
    await updateDoc(ref, { visibility })
    try { await changeDatabase(visibility) } catch (error) {
      try { await updateDoc(ref, { visibility: post.visibility }) } catch { /* Retry remains possible. */ }
      throw error
    }
  } else {
    await changeDatabase(visibility)
    try { await updateDoc(ref, { visibility }) } catch (error) {
      try { await changeDatabase(post.visibility) } catch { /* Retry remains possible. */ }
      throw error
    }
  }
  return { ...post, visibility }
}

export const loadPostImage = async (user, id) =>
  (await backendRequest(user, `/${encodeURIComponent(id)}/image`)).blob()
