import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import {
  collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp,
  setDoc, updateDoc, where,
} from 'firebase/firestore'

if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('Run this inside the Firestore emulator')
const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(':')
const env = await initializeTestEnvironment({
  projectId: 'uniconnect-rules-check',
  firestore: { host, port: Number(port), rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8') },
})

try {
  const owner = env.authenticatedContext('owner', { email: 'owner@example.com' }).firestore()
  const other = env.authenticatedContext('other', { email: 'other@example.com' }).firestore()
  const anonymous = env.unauthenticatedContext().firestore()
  const userDoc = doc(owner, 'users/owner')
  const post = doc(owner, 'posts/rules-test')
  const postForOther = doc(other, 'posts/rules-test')
  const fields = { authorUid: 'owner', content: 'Test post', visibility: 'private',
    createdAt: serverTimestamp(), originalCreatedAt: null, imageId: null }

  await assertSucceeds(setDoc(userDoc, { uid: 'owner', email: 'owner@example.com',
    username: 'owner_test', displayName: 'Owner', updatedAt: serverTimestamp() }))
  await assertFails(getDoc(doc(other, 'users/owner')))
  await assertFails(getDocs(collection(other, 'users')))

  await assertSucceeds(setDoc(post, fields))
  await assertSucceeds(getDoc(post))
  await assertSucceeds(getDocs(query(collection(owner, 'posts'), where('authorUid', '==', 'owner'))))
  await assertFails(getDoc(postForOther))
  await assertFails(getDocs(collection(other, 'posts')))
  await assertFails(getDoc(doc(anonymous, 'posts/rules-test')))
  await assertFails(setDoc(doc(other, 'posts/impersonation'), { ...fields, authorUid: 'owner' }))

  await assertSucceeds(updateDoc(post, { visibility: 'public' }))
  assert.equal((await assertSucceeds(getDoc(postForOther))).data().content, 'Test post')
  const shared = query(collection(other, 'posts'), where('visibility', '==', 'public'),
    orderBy('createdAt', 'desc'))
  assert.equal((await assertSucceeds(getDocs(shared))).size, 1)
  await assertFails(getDocs(collection(other, 'posts')))
  await assertFails(getDoc(doc(anonymous, 'posts/rules-test')))
  await assertFails(updateDoc(postForOther, { visibility: 'private' }))
  await assertFails(updateDoc(post, { authorUid: 'other' }))
  await assertFails(updateDoc(post, { content: 'Changed' }))
  await assertFails(updateDoc(post, { extra: true }))
  await assertSucceeds(updateDoc(post, { visibility: 'private' }))
  await assertFails(getDoc(postForOther))
  console.log('Firestore sharing and privacy rules passed in the emulator.')
} finally {
  await env.cleanup()
}
